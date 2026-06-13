import { createClient } from "@/lib/client";

const supabase = createClient();
let typingChannels = {};

/* =========================
   AUTH
========================= */

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  return user;
}

/* =========================
   USERS
========================= */

export async function getUsers(currentUserId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", currentUserId)
    .order("username", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function searchUsers(query, currentUserId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", currentUserId)
    .ilike("username", `%${query}%`)
    .limit(20);

  if (error) throw error;

  return data || [];
}

/* =========================
   CONVERSATIONS
========================= */

export async function getConversationId(otherUserId) {
  const { data, error } = await supabase.rpc(
    "get_or_create_conversation",
    {
      other_user_id: otherUserId,
    }
  );

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function getUserConversations(currentUserId) {
  const { data, error } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      conversations (
        id,
        last_message,
        last_message_at,
        created_at
      )
    `)
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  const conversationIds = data.map(
    (item) => item.conversations.id
  );

  const { data: members, error: membersError } =
    await supabase
      .from("conversation_members")
      .select(`
        conversation_id,
        user_id,
        profiles (
          id,
          username,
          avatar_url,
          is_online,
          last_seen
        )
      `)
      .in("conversation_id", conversationIds)
      .neq("user_id", currentUserId);

  if (membersError) throw membersError;

  const membersByConv = {};
  members?.forEach((item) => {
    if (!membersByConv[item.conversation_id]) {
      membersByConv[item.conversation_id] = [];
    }
    membersByConv[item.conversation_id].push(
      item.profiles
    );
  });

  const conversations = data.map((item) => ({
    id: item.conversations.id,
    lastMessage: item.conversations.last_message,
    lastMessageAt:
      item.conversations.last_message_at,
    createdAt: item.conversations.created_at,
    participants: membersByConv[
      item.conversations.id
    ] || [],
  }));

  return conversations.sort((a, b) => {
    const timeA = a.lastMessageAt
      ? new Date(a.lastMessageAt)
      : new Date(a.createdAt);
    const timeB = b.lastMessageAt
      ? new Date(b.lastMessageAt)
      : new Date(b.createdAt);
    return timeB - timeA;
  });
}

export async function getConversationWithUser(
  conversationId,
  currentUserId
) {
  const { data, error } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      user_id,
      profiles (
      id,
      username,
      full_name,
      avatar_url,
      bio,
      status,
      created_at,
      is_online,
      last_seen
    )
    `)
    .eq("conversation_id", conversationId)
    .neq("user_id", currentUserId);

  if (error) throw error;

  if (!data || data.length === 0) {
    return null;
  }

  return data[0].profiles;
}

/* =========================
   MESSAGES
========================= */

export async function getMessages(conversationId) {
  if (!conversationId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function sendMessage({
  conversationId,
  senderId,
  content,
}) {
  const trimmedMessage = content.trim();

  if (!trimmedMessage) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmedMessage,
    })
    .select()
    .single();

  if (error) throw error;

  const now = new Date().toISOString();

  await supabase
    .from("conversations")
    .update({
      last_message: trimmedMessage,
      last_message_at: now,
    })
    .eq("id", conversationId);

  try {
    const { data: recipient } =
      await supabase
        .from("conversation_members")
        .select(`
          user_id,
          profiles (
            username,
            fcm_token
          )
        `)
        .eq(
          "conversation_id",
          conversationId
        )
        .neq("user_id", senderId)
        .single();

    if (
      recipient?.profiles?.fcm_token
    ) {
      const {
        data: senderProfile,
      } = await supabase
        .from("profiles")
        .select(`
          username,
          avatar_url
        `)
        .eq("id", senderId)
        .single();

      await sendPushNotification({
        token:
          recipient.profiles
            .fcm_token,

        title:
          senderProfile?.username ||
          "New Message",

        body: trimmedMessage,

        avatarUrl:
          senderProfile?.avatar_url ||
          "",

        conversationId,
      });
    }
  } catch (pushError) {
    console.error(
      "Push notification error:",
      pushError
    );
  }

  return data;
}
/* =========================
   REALTIME
========================= */

export function subscribeToMessages(
  conversationId,
  callback
) {
  const channel = supabase
    .channel(`messages-${conversationId}`)

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )

    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )

    .subscribe();

  return channel;
}

export function subscribeToConversations(
  currentUserId,
  callback
) {
  const existingChannel =
    supabase
      .getChannels()
      .find(
        (channel) =>
          channel.topic ===
          `realtime:conversations-${currentUserId}`
      );

  if (existingChannel) {
    supabase.removeChannel(
      existingChannel
    );
  }

  const channel = supabase
    .channel(
      `conversations-${currentUserId}`
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table:
          "conversation_members",
        filter: `user_id=eq.${currentUserId}`,
      },
      callback
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table:
          "conversations",
      },
      callback
    )
    .subscribe();

  return channel;
}
export function unsubscribe(
  channel
) {
  if (!channel) return;

  Object.keys(
    typingChannels
  ).forEach((key) => {
    if (
      typingChannels[key] ===
      channel
    ) {
      delete typingChannels[key];
    }
  });

  supabase.removeChannel(
    channel
  );
}

/* =========================
   PRESENCE
========================= */

export async function setUserOnline(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({
      is_online: true,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error setting user online:", error);
    throw error;
  }
}

export async function setUserOffline(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({
      is_online: false,
      last_seen: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error setting user offline:", error);
    throw error;
  }
}

export function subscribeToProfiles(callback) {
  const channel = supabase
    .channel(
      `profiles-presence-${Date.now()}`
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
}


export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return {
    ...data,
    email: user.email,
  };
}

export async function updateProfile(data) {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data: profile, error } =
    await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id)
      .select()
      .single();

  if (error) throw error;

  return profile;
}

export async function uploadAvatar(file) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User not found");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG and WEBP allowed"
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(
      "File size must be below 5MB"
    );
  }

  const fileExt =
    file.name.split(".").pop();

  const filePath =
    `${user.id}/avatar.${fileExt}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  await updateProfile({
    avatar_url: publicUrl,
  });

  return publicUrl;
}

export async function markMessagesAsRead(
  conversationId,
  currentUserId
) {
  const { error } =
    await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at:
          new Date().toISOString(),
      })
      .eq(
        "conversation_id",
        conversationId
      )
      .neq(
        "sender_id",
        currentUserId
      )
      .eq("is_read", false);

  if (error) throw error;
}

export function subscribeToTyping(
  conversationId,
  callback
) {
  const channel = supabase
    .channel(
      `typing-${conversationId}`
    )
    .on(
      "broadcast",
      {
        event: "typing",
      },
      ({ payload }) => {
        callback(payload);
      }
    );

  channel.subscribe();

  typingChannels[
    conversationId
  ] = channel;

  return channel;
}

export async function sendTypingEvent(
  conversationId,
  userId,
  isTyping
) {
  const channel =
    typingChannels[
      conversationId
    ];

  if (!channel) return;

  await channel.send({
    type: "broadcast",
    event: "typing",
    payload: {
      userId,
      isTyping,
    },
  });
}

export function unsubscribeTyping(
  conversationId
) {
  const channel =
    typingChannels[
      conversationId
    ];

  if (!channel) return;

  delete typingChannels[
    conversationId
  ];

  supabase.removeChannel(
    channel
  );
}

export async function updateFCMToken(
  token
) {
  const user =
    await getCurrentUser();

  if (!user) return;

  const { error } =
    await supabase
      .from("profiles")
      .update({
        fcm_token: token,
      })
      .eq("id", user.id);

  if (error) throw error;
}


export async function sendPushNotification({
  token,
  title,
  body,
  avatarUrl,
  conversationId,
}) {
  try {
    await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        title,
        body,
        avatarUrl,
        conversationId,
      }),
    });
  } catch (error) {
    console.error(
      "Push notification failed",
      error
    );
  }
}