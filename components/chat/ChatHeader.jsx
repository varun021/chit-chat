"use client";

import useChatStore from "@/store/chatStore";

export default function ChatHeader() {
  const { selectedUser } = useChatStore();

  if (!selectedUser) {
    return (
      <div className="h-16 border-b flex items-center px-6">
        Select a user
      </div>
    );
  }

  return (
    <div className="h-16 border-b flex items-center px-6">
      <div>
        <h2 className="font-semibold">
          {selectedUser.username}
        </h2>

        <p className="text-xs text-muted-foreground">
          {selectedUser.is_online
            ? "Online"
            : "Offline"}
        </p>
      </div>
    </div>
  );
}