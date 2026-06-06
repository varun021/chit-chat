"use client";

import { useEffect } from "react";

import useChatStore from "@/store/chatStore";

import {
  subscribeToMessages,
  unsubscribe,
} from "@/services/chat";

export default function ChatMessages() {
  const {
    messages,
    conversationId,
    currentUserId,
    addMessage,
  } = useChatStore();

  useEffect(() => {
    if (!conversationId) return;

    const channel =
      subscribeToMessages(
        conversationId,
        (message) => {
          addMessage(message);
        }
      );

    return () => {
      unsubscribe(channel);
    };
  }, [
    conversationId,
    addMessage,
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => {
        const isMine =
          message.sender_id === currentUserId;

        return (
          <div
            key={message.id}
            className={`flex ${
              isMine
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-sm ${
                isMine
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}