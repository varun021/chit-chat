import { create } from "zustand";

const useChatStore = create((set) => ({
  currentUserId: null,

  selectedUser: null,
  conversationId: null,
  messages: [],

  setCurrentUserId: (id) =>
    set({
      currentUserId: id,
    }),

  setSelectedUser: (user) =>
    set({
      selectedUser: user,
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
}));

export default useChatStore;