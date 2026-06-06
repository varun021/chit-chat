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

export async function getUserConversations() {
  const { data, error } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      conversations (
        id,
        created_at
      )
    `);

  if (error) throw error;

  return data || [];
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

export function unsubscribe(channel) {
  supabase.removeChannel(channel);
}