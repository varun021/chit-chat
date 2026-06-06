"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import useChatStore from "@/store/chatStore";
import {
  getCurrentUser,
  getUserConversations,
  getConversationWithUser,
  getConversationId,
  getMessages,
  searchUsers,
  subscribeToConversations,
  subscribeToProfiles,
  unsubscribe,
} from "@/services/chat";

function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function truncateMessage(message, maxLength = 40) {
  if (!message) return "";
  return message.length > maxLength
    ? message.substring(0, maxLength) + "..."
    : message;
}

export default function ChatSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(
    []
  );
  const [isSearching, setIsSearching] = useState(false);

  const {
    currentUserId,
    conversations,
    selectedConversation,
    setCurrentUserId,
    setConversations,
    setSelectedConversation,
    setConversationId,
    setMessages,
    updateProfile,
  } = useChatStore();

  useEffect(() => {
    let channel;
    let profileChannel;

    async function initialize() {
      try {
        const currentUser =
          await getCurrentUser();

        if (!currentUser) return;

        setCurrentUserId(currentUser.id);

        const convs =
          await getUserConversations(currentUser.id);

        const conversationsWithDetails = await Promise.all(
          convs.map(async (conv) => {
            try {
              const user =
                await getConversationWithUser(
                  conv.id,
                  currentUser.id
                );
              return {
                ...conv,
                otherUser: user,
              };
            } catch (error) {
              console.error(
                "Error fetching conversation details:",
                error
              );
              return conv;
            }
          })
        );

        setConversations(
          conversationsWithDetails
        );

        channel =
          subscribeToConversations(
            currentUser.id,
            async () => {
              const updated =
                await getUserConversations(
                  currentUser.id
                );

              const withDetails = await Promise.all(
                updated.map(async (conv) => {
                  try {
                    const user =
                      await getConversationWithUser(
                        conv.id,
                        currentUser.id
                      );
                    return {
                      ...conv,
                      otherUser: user,
                    };
                  } catch (error) {
                    console.error(
                      "Error fetching conversation details:",
                      error
                    );
                    return conv;
                  }
                })
              );

              setConversations(withDetails);
            }
          );

        profileChannel = subscribeToProfiles((profile) => {
          if (profile && profile.id) {
            updateProfile(profile.id, {
              is_online: profile.is_online,
              last_seen: profile.last_seen,
            });
          }
        });
      } catch (error) {
        console.error(
          "Failed to initialize chat:",
          error
        );
      }
    }

    initialize();

    return () => {
      if (channel) {
        unsubscribe(channel);
      }
      if (profileChannel) {
        unsubscribe(profileChannel);
      }
    };
  }, [
    setCurrentUserId,
    setConversations,
    updateProfile,
  ]);

  async function handleSearch(query) {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchUsers(
        query,
        currentUserId
      );
      setSearchResults(results);
    } catch (error) {
      console.error(
        "Failed to search users:",
        error
      );
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectUser(user) {
    try {
      const conversationId =
        await getConversationId(user.id);

      setSelectedConversation({
        id: conversationId,
        otherUser: user,
        lastMessage: null,
        lastMessageAt: null,
        participants: [user],
      });

      setConversationId(conversationId);

      const messages =
        await getMessages(conversationId);

      setMessages(messages);

      setSearchQuery("");
      setSearchResults([]);

      const updatedConversations =
        await getUserConversations(currentUserId);

      const withDetails = await Promise.all(
        updatedConversations.map(async (conv) => {
          try {
            const u =
              await getConversationWithUser(
                conv.id,
                currentUserId
              );
            return {
              ...conv,
              otherUser: u,
            };
          } catch (error) {
            console.error(
              "Error fetching conversation details:",
              error
            );
            return conv;
          }
        })
      );

      setConversations(withDetails);
    } catch (error) {
      console.error(
        "Failed to open conversation:",
        error
      );
    }
  }

  async function handleSelectConversation(
    conversation
  ) {
    try {
      setSelectedConversation(conversation);
      setConversationId(conversation.id);

      const messages =
        await getMessages(conversation.id);

      setMessages(messages);
    } catch (error) {
      console.error(
        "Failed to open conversation:",
        error
      );
    }
  }

  const displayResults = searchQuery.trim()
    ? searchResults
    : [];

  const otherUserName =
    selectedConversation?.otherUser?.username;

  return (
    <aside className="w-80 border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-bold text-xl">
          ChitChat
        </h2>

        <Input
          className="mt-3"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) =>
            handleSearch(e.target.value)
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim() ? (
          displayResults.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              {isSearching
                ? "Searching..."
                : "No users found"}
            </div>
          ) : (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                Users
              </div>
              {displayResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() =>
                    handleSelectUser(user)
                  }
                  className="w-full p-4 text-left border-b hover:bg-muted transition flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 relative">
                    {user.username?.[0]?.toUpperCase()}
                    {user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        user.is_online ? "bg-green-500" : "bg-gray-400"
                      }`} />
                      {user.is_online
                        ? "Online"
                        : "Offline"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No conversations yet. Search for a
            user to start chatting!
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() =>
                handleSelectConversation(
                  conversation
                )
              }
              className={`w-full p-4 text-left border-b hover:bg-muted transition flex items-center gap-3 ${
                selectedConversation?.id ===
                conversation.id
                  ? "bg-muted"
                  : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 relative">
                {conversation.otherUser
                  ?.username?.[0]?.toUpperCase()}
                {conversation.otherUser?.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {conversation.otherUser
                    ?.username}
                </p>

                <p className="text-xs text-muted-foreground truncate">
                  {truncateMessage(
                    conversation.lastMessage
                  )}
                </p>
              </div>

              <div className="text-xs text-muted-foreground flex-shrink-0">
                {formatTime(
                  conversation.lastMessageAt
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}