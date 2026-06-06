import { create } from "zustand";

const useChatStore = create((set) => ({
  currentUserId: null,

  conversations: [],
  selectedConversation: null,
  conversationId: null,
  messages: [],

  profiles: {},

  setCurrentUserId: (id) =>
    set({
      currentUserId: id,
    }),

  setConversations: (conversations) =>
    set({
      conversations,
    }),

  addConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some(
        (conv) => conv.id === conversation.id
      );

      if (exists) {
        return state;
      }

      return {
        conversations: [conversation, ...state.conversations],
      };
    }),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? { ...conv, ...updates }
          : conv
      ),
    })),

  setSelectedConversation: (conversation) =>
    set({
      selectedConversation: conversation,
    }),

  setConversationId: (id) =>
    set({
      conversationId: id,
    }),

  setMessages: (messages) =>
    set({
      messages,
    }),

  addMessage: (message) =>
    set((state) => {
      const exists = state.messages.some(
        (msg) => msg.id === message.id
      );

      if (exists) {
        return state;
      }

      return {
        messages: [...state.messages, message],
      };
    }),

  setProfiles: (profiles) =>
    set({
      profiles,
    }),

  updateProfile: (userId, profile) =>
    set((state) => ({
      profiles: {
        ...state.profiles,
        [userId]: {
          ...state.profiles[userId],
          ...profile,
        },
      },
    })),
}));

export default useChatStore;