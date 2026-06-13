"use client";

import { Circle, Calendar, Quote } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

import { formatLastSeen } from "@/lib/formatters";

export default function UserProfileModal({ user, open, onOpenChange }) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-[400px] rounded-2xl p-0 overflow-hidden gap-0 border-border/60 bg-background shadow-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{user.username}'s Profile</DialogTitle>
        </DialogHeader>

        {/* Minimal Banner Background */}
        <div className="h-28 w-full bg-gradient-to-br from-primary/10 via-transparent to-muted/30" />

        <div className="relative flex flex-col items-center px-6 pb-6">
          {/* Avatar Placement */}
          <div className="absolute -top-12">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {user.username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Identity Handle */}
          <div className="mt-14 text-center">
            <h2 className="text-xl font-bold tracking-tight">@{user.username}</h2>
          </div>

          {/* Real-time Presence State */}
          <div className="mt-3">
            {user.is_online ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/10">
                <Circle className="h-1.5 w-1.5 fill-current" />
                Active Now
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                <Circle className="h-1.5 w-1.5 fill-muted-foreground/30 text-muted-foreground/30" />
                Last seen {user.last_seen ? formatLastSeen(user.last_seen) : "offline"}
              </div>
            )}
          </div>

          {/* Plain Status Box */}
          <div className="w-full mt-5">
            <div className="rounded-xl border bg-muted/20 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Quote className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                  Status
                </span>
              </div>
              <p className="text-sm italic text-foreground/90">
                {user.status || "No status text configured."}
              </p>
            </div>
          </div>

          {/* Simplified Timeline Metric */}
          <div className="w-full mt-3">
            <div className="rounded-xl border bg-muted/10 p-3 flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground/60" />
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                  Member Since
                </p>
                <p className="text-xs font-medium text-foreground/80">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Recent"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}