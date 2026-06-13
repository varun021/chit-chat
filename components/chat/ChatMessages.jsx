"use client";

import { useEffect, useRef } from "react";
import {
  MessageSquare,
  Check,
  CheckCheck,
} from "lucide-react";

import useChatStore from "@/store/chatStore";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  subscribeToMessages,
  unsubscribe,
  markMessagesAsRead,
} from "@/services/chat";

function formatMessageTime(dateString) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChatMessages() {
  const messagesEndRef = useRef(null);

  const {
    messages,
    conversationId,
    currentUserId,
    selectedConversation,
    addMessage,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    if (
      !conversationId ||
      !currentUserId
    ) {
      return;
    }

    markMessagesAsRead(
      conversationId,
      currentUserId
    ).catch(console.error);
  }, [
    conversationId,
    currentUserId,
    messages.length,
  ]);

  const otherUser =
    selectedConversation?.otherUser;

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
        <div className="p-4 rounded-full bg-muted/50 mb-4 animate-pulse">
          <MessageSquare className="h-10 w-10 text-muted-foreground/60" />
        </div>

        <h3 className="text-base font-semibold tracking-tight">
          Your Inbox
        </h3>

        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Select an active conversation
          from the sidebar or search
          for a user to initiate a
          new chat.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-background/50">
      <div className="flex flex-col min-h-full justify-end p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Avatar className="h-16 w-16 mb-3 ring-4 ring-muted">
              <AvatarImage
                src={
                  otherUser?.avatar_url ||
                  ""
                }
                alt={
                  otherUser?.username
                }
              />

              <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                {otherUser?.username
                  ?.charAt(0)
                  ?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <h4 className="text-sm font-semibold">
              Say hello to{" "}
              {otherUser?.username}!
            </h4>

            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              This is the very beginning
              of your direct message
              history.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isMine =
                message.sender_id ===
                currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    isMine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {!isMine && (
                    <Avatar className="h-8 w-8 flex-shrink-0 mb-1 border border-border/40">
                      <AvatarImage
                        src={
                          otherUser?.avatar_url ||
                          ""
                        }
                        alt={
                          otherUser?.username
                        }
                      />

                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {otherUser?.username
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%] space-y-1 ${
                      isMine
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 text-sm shadow-sm leading-relaxed break-words whitespace-pre-wrap ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                          : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.created_at && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 px-1 select-none">
                        <span>
                          {formatMessageTime(
                            message.created_at
                          )}
                        </span>

                        {isMine &&
                          (message.is_read ? (
                            <CheckCheck className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Check className="h-3 w-3" />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          ref={messagesEndRef}
          className="h-2"
        />
      </div>
    </ScrollArea>
  );
}