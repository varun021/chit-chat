"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import useChatStore from "@/store/chatStore";

import {
  getCurrentUser,
  sendMessage,
} from "@/services/chat";

export default function ChatInput() {
  const [text, setText] = useState("");

  const {
    conversationId,
    addMessage,
  } = useChatStore();

  async function handleSend() {
    if (!conversationId) return;

    const currentUser =
      await getCurrentUser();

    const message =
      await sendMessage({
        conversationId,
        senderId: currentUser.id,
        content: text,
      });

    if (message) {
        setText("");
        }
  }

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
        />

        <Button onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}