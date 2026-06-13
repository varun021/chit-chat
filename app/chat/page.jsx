"use client";

import { usePresence } from "@/hooks/usePresence";
import useChatStore from "@/store/chatStore";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import useNotifications from "@/hooks/useNotifications";

export default function ChatPage() {
  usePresence();
  useNotifications();

  const { selectedConversation } =
    useChatStore();

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={`
          ${
            selectedConversation
              ? "hidden"
              : "flex"
          }
          md:flex
          w-full
          md:w-80
          lg:w-96
          shrink-0
          overflow-hidden
        `}
      >
        <ChatSidebar />
      </div>

      {/* Chat Area */}
      <div
        className={`
          ${
            selectedConversation
              ? "flex"
              : "hidden"
          }
          md:flex
          flex-1
          flex-col
          min-w-0
          min-h-0
          overflow-hidden
        `}
      >
        <ChatHeader />

        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatMessages />
        </div>

        <ChatInput />
      </div>
    </div>
  );
}