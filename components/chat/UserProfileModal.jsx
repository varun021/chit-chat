"use client";

import { Circle, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import { formatLastSeen } from "@/lib/formatters";

export default function UserProfileModal({ user, open, onOpenChange }) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-[400px] rounded-2xl p-0 overflow-hidden gap-0 border-border/60 bg-background shadow-lg">
        {/* Hidden title for Screen Reader accessibility compliance */}
        <DialogHeader className="sr-only">
          <DialogTitle>{user.username}'s Profile</DialogTitle>
        </DialogHeader>

        {/* Decorative Modern Backdrop Banner */}
        <div className="h-28 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-muted/20 relative" />

        {/* Modal Inner Wrap Container */}
        <div className="relative flex flex-col items-center px-5 pb-6 text-center">
          
          {/* Overlapping Floating Avatar Structure */}
          <div className="absolute -top-12 z-10">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl rounded-full">
              <AvatarImage 
                src={user.avatar_url || undefined} 
                alt={user.username} 
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {user.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Identity Headers */}
          <div className="mt-14 space-y-1 w-full">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {user.username}
            </h2>
            
            {user.full_name ? (
              <p className="text-sm text-muted-foreground font-medium">
                {user.full_name}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic flex items-center justify-center gap-1">
                <User className="h-3 w-3" /> No full name provided
              </p>
            )}
          </div>

          {/* Real-Time Live Status Badge Area */}
          <div className="mt-3">
            {user.is_online ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold ring-1 ring-emerald-500/20 select-none animate-pulse">
                <Circle className="h-2 w-2 fill-current" />
                <span>Active Now</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium ring-1 ring-border/40 select-none">
                <Circle className="h-2 w-2 fill-muted-foreground/40 text-muted-foreground/40" />
                <span>
                  Last seen {user.last_seen ? formatLastSeen(user.last_seen) : "offline"}
                </span>
              </div>
            )}
          </div>

          {/* Conditional Segment Block: User Bio */}
          {user.bio && (
            <div className="w-full mt-6 space-y-3">
              <Separator className="bg-border/60" />
              
              <div className="w-full rounded-xl bg-muted/30 border border-border/40 p-4 text-left backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/90 mb-1.5 select-none">
                  About Me
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap">
                  {user.bio}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}