"use client";

import { useState, useRef, useEffect } from "react";

import {
  SendHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import useChatStore from "@/store/chatStore";

import {
  getCurrentUser,
  sendMessage,
  sendTypingEvent,
} from "@/services/chat";

export default function ChatInput() {
  const [text, setText] = useState("");
  const [isSending, setIsSending] =
    useState(false);

  const typingTimeoutRef =
    useRef(null);

  const { conversationId } =
    useChatStore();

  async function handleTyping(
    value
  ) {
    setText(value);

    if (!conversationId) return;

    try {
      const currentUser =
        await getCurrentUser();

      if (!currentUser) return;

      await sendTypingEvent(
        conversationId,
        currentUser.id,
        true
      );

      clearTimeout(
        typingTimeoutRef.current
      );

      typingTimeoutRef.current =
        setTimeout(async () => {
          try {
            await sendTypingEvent(
              conversationId,
              currentUser.id,
              false
            );
          } catch (error) {
            console.error(
              "Failed to send typing status:",
              error
            );
          }
        }, 1500);
    } catch (error) {
      console.error(
        "Typing indicator error:",
        error
      );
    }
  }

  async function handleSend(e) {
    if (e) e.preventDefault();

    if (
      !conversationId ||
      !text.trim() ||
      isSending
    )
      return;

    setIsSending(true);

    try {
      const currentUser =
        await getCurrentUser();

      if (!currentUser) return;

      const message =
        await sendMessage({
          conversationId,
          senderId:
            currentUser.id,
          content:
            text.trim(),
        });

      if (message) {
        await sendTypingEvent(
          conversationId,
          currentUser.id,
          false
        );

        clearTimeout(
          typingTimeoutRef.current
        );

        setText("");
      }
    } catch (error) {
      console.error(
        "Failed to transmit message payload:",
        error
      );
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
  return () => {
    clearTimeout(
      typingTimeoutRef.current
    );
  };
}, []);

  if (!conversationId)
    return null;

  return (
    <div className="shrink-0 border-t p-3 md:p-4 bg-background">
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 max-w-7xl mx-auto"
      >
        <div className="flex-1 relative">
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={(e) =>
              handleTyping(
                e.target.value
              )
            }
            disabled={isSending}
            maxLength={1000}
            className="w-full bg-muted/40 pr-4 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:bg-background transition-all h-10 text-sm"
          />
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={
            !text.trim() ||
            isSending
          }
          className="rounded-xl h-10 w-10 shrink-0 shadow-sm shadow-primary/20 transition-transform active:scale-95"
        >
          <SendHorizontal
            className={`h-4 w-4 ${
              text.trim() &&
              !isSending
                ? "animate-none"
                : "opacity-80"
            }`}
          />

          <span className="sr-only">
            Send Message
          </span>
        </Button>
      </form>
    </div>
  );
}