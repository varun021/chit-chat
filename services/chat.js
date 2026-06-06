import { createClient } from "@/lib/client";

const supabase = createClient();

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
        avatar_url,
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
    .subscribe();

  return channel;
}

export function subscribeToConversations(
  currentUserId,
  callback
) {
  const channel = supabase
    .channel(`conversations-${currentUserId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversation_members",
        filter: `user_id=eq.${currentUserId}`,
      },
      () => {
        callback();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribe(channel) {
  supabase.removeChannel(channel);
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