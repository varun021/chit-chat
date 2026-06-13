"use client";

import { useEffect, useState } from "react";

import {
  ChevronLeft,
  Info,
  Circle,
} from "lucide-react";

import useChatStore from "@/store/chatStore";

import UserProfileModal from "./UserProfileModal";

import { Button } from "@/components/ui/button";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  subscribeToProfiles,
  subscribeToTyping,
  unsubscribe,
} from "@/services/chat";

import { formatLastSeen } from "@/lib/formatters";

export default function ChatHeader() {
  const {
    selectedConversation,
    updateProfile,
    setSelectedConversation,
    setConversationId,
    typingUsers,
    setTyping,
  } = useChatStore();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [statusText, setStatusText] =
    useState("");

  useEffect(() => {
    if (
      !selectedConversation ||
      !selectedConversation.otherUser
    ) {
      setStatusText("");
      return;
    }

    const user =
      selectedConversation.otherUser;

    if (user.is_online) {
      setStatusText("Online");
    } else if (user.last_seen) {
      setStatusText(
        `Last seen ${formatLastSeen(
          user.last_seen
        )}`
      );
    } else {
      setStatusText("Offline");
    }
  }, [
    selectedConversation,
    selectedConversation?.otherUser
      ?.is_online,
    selectedConversation?.otherUser
      ?.last_seen,
  ]);

  useEffect(() => {
    if (
      !selectedConversation ||
      !selectedConversation.otherUser
    ) {
      return;
    }

    const user =
      selectedConversation.otherUser;

    let channel;

    async function subscribeToUser() {
      try {
        channel =
          subscribeToProfiles(
            (profile) => {
              if (
                profile.id === user.id
              ) {
                updateProfile(
                  profile.id,
                  {
                    is_online:
                      profile.is_online,
                    last_seen:
                      profile.last_seen,
                  }
                );

                if (
                  profile.is_online
                ) {
                  setStatusText(
                    "Online"
                  );
                } else if (
                  profile.last_seen
                ) {
                  setStatusText(
                    `Last seen ${formatLastSeen(
                      profile.last_seen
                    )}`
                  );
                } else {
                  setStatusText(
                    "Offline"
                  );
                }
              }
            }
          );
      } catch (error) {
        console.error(
          "Failed to subscribe to user presence:",
          error
        );
      }
    }

    subscribeToUser();

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
    };
  }, [
    selectedConversation,
    updateProfile,
  ]);

  useEffect(() => {
    if (
      !selectedConversation
    ) {
      return;
    }

    const channel =
      subscribeToTyping(
        selectedConversation.id,
        (payload) => {
          setTyping(
            payload.userId,
            payload.isTyping
          );
        }
      );

    return () => {
      unsubscribe(channel);
    };
  }, [
    selectedConversation,
    setTyping,
  ]);

  const handleBackToSidebar =
    () => {
      setSelectedConversation(
        null
      );

      setConversationId(null);
    };

  if (
    !selectedConversation ||
    !selectedConversation.otherUser
  ) {
    return (
      <div className="h-16 shrink-0 border-b flex items-center px-4 md:px-6 bg-background/95 backdrop-blur">
        <p className="text-sm text-muted-foreground select-none">
          No active conversation
        </p>
      </div>
    );
  }

  const otherUser =
    selectedConversation.otherUser;

  const isOnline =
    otherUser.is_online;

  const isTyping =
    typingUsers?.[
      otherUser.id
    ];

  return (
    <div className="h-16 shrink-0 border-b flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur sticky top-0 z-10">
      <div className="flex items-center gap-1 md:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={
            handleBackToSidebar
          }
          className="md:hidden h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <button
          onClick={() =>
            setProfileOpen(true)
          }
          className="flex items-center gap-3 text-left p-1 rounded-lg hover:bg-accent/50 transition-colors group min-w-0 max-w-full"
        >
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border border-border/40">
              <AvatarImage
                src={
                  otherUser.avatar_url ||
                  ""
                }
                alt={
                  otherUser.username
                }
              />

              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {otherUser.username
                  ?.charAt(0)
                  ?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background ring-1 ring-border/10" />
            )}
          </div>

          <div className="min-w-0 pr-2">
            <h2 className="text-sm font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
              {otherUser.username}
            </h2>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              {isTyping ? (
                <span className="text-primary animate-pulse">
                  typing...
                </span>
              ) : (
                <>
                  {!isOnline && (
                    <Circle className="h-1.5 w-1.5 fill-muted-foreground/40 text-muted-foreground/40" />
                  )}

                  <span>
                    {statusText}
                  </span>
                </>
              )}
            </p>
          </div>
        </button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() =>
          setProfileOpen(true)
        }
        className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
      >
        <Info className="h-4 w-4" />
      </Button>

      <UserProfileModal
        user={otherUser}
        open={profileOpen}
        onOpenChange={
          setProfileOpen
        }
      />
    </div>
  );
}