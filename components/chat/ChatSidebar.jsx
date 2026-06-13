"use client";

import { useEffect, useState } from "react";
import { Search, MessageSquareDashed, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

function truncateMessage(message, maxLength = 35) {
  if (!message) return "";
  return message.length > maxLength
    ? message.substring(0, maxLength) + "..."
    : message;
}

export default function ChatSidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

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
      setIsInitializing(true);
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        setCurrentUserId(currentUser.id);

        const convs = await getUserConversations(currentUser.id);
        const conversationsWithDetails = await Promise.all(
          convs.map(async (conv) => {
            try {
              const user = await getConversationWithUser(conv.id, currentUser.id);
              return { ...conv, otherUser: user };
            } catch (error) {
              console.error("Error fetching conversation details:", error);
              return conv;
            }
          })
        );

        setConversations(conversationsWithDetails);

        channel = subscribeToConversations(currentUser.id, async () => {
          const updated = await getUserConversations(currentUser.id);
          const withDetails = await Promise.all(
            updated.map(async (conv) => {
              try {
                const user = await getConversationWithUser(conv.id, currentUser.id);
                return { ...conv, otherUser: user };
              } catch (error) {
                console.error("Error fetching conversation details:", error);
                return conv;
              }
            })
          );
          setConversations(withDetails);
        });

        profileChannel = subscribeToProfiles((profile) => {
          if (profile && profile.id) {
            updateProfile(profile.id, {
              is_online: profile.is_online,
              last_seen: profile.last_seen,
            });
          }
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      } finally {
        setIsInitializing(false);
      }
    }

    initialize();

    return () => {
      if (channel) unsubscribe(channel);
      if (profileChannel) unsubscribe(profileChannel);
    };
  }, [setCurrentUserId, setConversations, updateProfile]);

  async function handleSearch(query) {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query, currentUserId);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectUser(user) {
    try {
      const conversationId = await getConversationId(user.id);

      setSelectedConversation({
        id: conversationId,
        otherUser: user,
        lastMessage: null,
        lastMessageAt: null,
        participants: [user],
      });

      setConversationId(conversationId);
      const messages = await getMessages(conversationId);
      setMessages(messages);

      setSearchQuery("");
      setSearchResults([]);

      const updatedConversations = await getUserConversations(currentUserId);
      const withDetails = await Promise.all(
        updatedConversations.map(async (conv) => {
          try {
            const u = await getConversationWithUser(conv.id, currentUserId);
            return { ...conv, otherUser: u };
          } catch (error) {
            console.error("Error fetching conversation details:", error);
            return conv;
          }
        })
      );

      setConversations(withDetails);
    } catch (error) {
      console.error("Failed to open conversation:", error);
    }
  }

  async function handleSelectConversation(conversation) {
    try {
      setSelectedConversation(conversation);
      setConversationId(conversation.id);

      const messages = await getMessages(conversation.id);
      setMessages(messages);
    } catch (error) {
      console.error("Failed to open conversation:", error);
    }
  }

  const displayResults = searchQuery.trim() ? searchResults : [];

  return (
    <aside className="flex flex-col h-full w-full md:w-80 lg:w-96 border-r bg-background shrink-0">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">ChitChat</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-muted/50 focus-visible:ring-1"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>
      
      <Separator />

      <ScrollArea className="flex-1">
        {isInitializing ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          displayResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <UserX className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {isSearching ? "Searching..." : "No users found"}
              </p>
            </div>
          ) : (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Users
              </div>
              {displayResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage src={user.avatar_url || ""} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background ring-1 ring-border/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-none mb-1">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.is_online ? "Online" : "Offline"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4">
            <MessageSquareDashed className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">No conversations yet.</p>
            <p className="text-xs mt-1">Search for a user to start chatting!</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => {
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                    isSelected
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage
                        src={conversation.otherUser?.avatar_url || ""}
                        alt={conversation.otherUser?.username}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conversation.otherUser?.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.otherUser?.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background ring-1 ring-border/10" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {conversation.otherUser?.username}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate leading-snug">
                      {truncateMessage(conversation.lastMessage)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}