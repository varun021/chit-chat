import { create } from "zustand";

const useChatStore = create((set) => ({
  currentUserId: null,

  conversations: [],
  selectedConversation: null,
  conversationId: null,
  messages: [],

  profiles: {},
  typingUsers: {},

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
    const existingIndex =
      state.messages.findIndex(
        (msg) => msg.id === message.id
      );

    if (existingIndex !== -1) {
      const updatedMessages = [
        ...state.messages,
      ];

      updatedMessages[
        existingIndex
      ] = {
        ...updatedMessages[
          existingIndex
        ],
        ...message,
      };

      return {
        messages:
          updatedMessages,
      };
    }

    return {
      messages: [
        ...state.messages,
        message,
      ],
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


  setTyping: (userId, isTyping) =>
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [userId]: isTyping,
        },
      })),

    clearTyping: (userId) =>
      set((state) => {
        const updated = {
          ...state.typingUsers,
        };

        delete updated[userId];

        return {
          typingUsers: updated,
        };
  }),
}));

export default useChatStore;