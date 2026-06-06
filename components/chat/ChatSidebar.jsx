"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import useChatStore from "@/store/chatStore";

import {
  getCurrentUser,
  getUsers,
  getConversationId,
  getMessages,
} from "@/services/chat";

export default function ChatSidebar() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const {
    selectedUser,
    setSelectedUser,
    setConversationId,
    setMessages,
    setCurrentUserId,
  } = useChatStore();

  useEffect(() => {
    async function loadUsers() {
      try {
        const currentUser =
          await getCurrentUser();

        if (!currentUser) return;

        setCurrentUserId(currentUser.id);

        const profiles =
          await getUsers(currentUser.id);

        setUsers(profiles);
      } catch (error) {
        console.error(
          "Failed to load users:",
          error
        );
      }
    }

    loadUsers();
  }, [setCurrentUserId]);

  async function handleSelectUser(user) {
    try {
      setSelectedUser(user);

      const conversationId =
        await getConversationId(user.id);

      setConversationId(conversationId);

      const messages =
        await getMessages(conversationId);

      setMessages(messages);
    } catch (error) {
      console.error(
        "Failed to open conversation:",
        error
      );
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <aside className="w-80 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-bold text-xl">
          ChitChat
        </h2>

        <Input
          className="mt-3"
          placeholder="Search users..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() =>
                handleSelectUser(user)
              }
              className={`w-full p-4 text-left border-b hover:bg-muted transition ${
                selectedUser?.id === user.id
                  ? "bg-muted"
                  : ""
              }`}
            >
              <p className="font-medium">
                {user.username}
              </p>

              <p className="text-xs text-muted-foreground">
                {user.is_online
                  ? "🟢 Online"
                  : "⚫ Offline"}
              </p>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}