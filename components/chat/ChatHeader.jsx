"use client";

import { useEffect, useState } from "react";
import useChatStore from "@/store/chatStore";
import { subscribeToProfiles, unsubscribe } from "@/services/chat";
import { formatLastSeen } from "@/lib/formatters";

export default function ChatHeader() {
  const { selectedConversation, profiles, updateProfile } = useChatStore();
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (!selectedConversation || !selectedConversation.otherUser) {
      setStatusText("");
      return;
    }

    const user = selectedConversation.otherUser;

    if (user.is_online) {
      setStatusText("Online");
    } else if (user.last_seen) {
      setStatusText(`Last seen ${formatLastSeen(user.last_seen)}`);
    } else {
      setStatusText("Offline");
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation || !selectedConversation.otherUser) {
      return;
    }

    const user = selectedConversation.otherUser;
    let channel;

    async function subscribeToUser() {
      try {
        channel = subscribeToProfiles((profile) => {
          if (profile.id === user.id) {
            updateProfile(profile.id, {
              is_online: profile.is_online,
              last_seen: profile.last_seen,
            });

            if (profile.is_online) {
              setStatusText("Online");
            } else if (profile.last_seen) {
              setStatusText(`Last seen ${formatLastSeen(profile.last_seen)}`);
            } else {
              setStatusText("Offline");
            }
          }
        });
      } catch (error) {
        console.error("Failed to subscribe to user presence:", error);
      }
    }

    subscribeToUser();

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
    };
  }, [selectedConversation, updateProfile]);

  if (!selectedConversation || !selectedConversation.otherUser) {
    return (
      <div className="h-16 border-b flex items-center px-6">
        Select a conversation
      </div>
    );
  }

  const otherUser = selectedConversation.otherUser;
  const isOnline = otherUser.is_online;

  return (
    <div className="h-16 border-b flex items-center px-6">
      <div>
        <h2 className="font-semibold">
          {otherUser.username}
        </h2>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className={`inline-block w-2 h-2 rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`} />
          {statusText}
        </p>
      </div>
    </div>
  );
}