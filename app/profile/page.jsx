"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Camera, ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentProfile, updateProfile, uploadAvatar } from "@/services/chat";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getCurrentProfile();
        setProfile(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      }
    }
    loadProfile();
  }, []);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const url = await uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatar_url: url }));
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!profile?.username?.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      setLoading(true);
      const updated = await updateProfile({
        username: profile.username.trim(),
        status: profile.status?.trim() || null,
      });
      setProfile(updated);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-4 md:p-8 space-y-4 bg-background text-foreground min-h-screen">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/chat")} className="gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="border border-border/60 rounded-xl p-6 bg-card space-y-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account credentials and status.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute -bottom-1 -right-1 cursor-pointer bg-primary text-primary-foreground p-2 rounded-xl shadow-sm border border-background hover:bg-primary/90 transition-colors">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" disabled={loading} className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h2 className="font-bold text-lg">@{profile.username}</h2>
            <p className="text-sm text-muted-foreground line-clamp-1 italic">{profile.status || "No active status"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              disabled={loading}
              value={profile.username || ""}
              className="rounded-xl bg-muted/20"
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="opacity-60">Email Address</Label>
            <Input id="email" value={profile.email || ""} disabled className="rounded-xl bg-muted/10 opacity-60 cursor-not-allowed" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status Message</Label>
            <Input
              id="status"
              maxLength={80}
              disabled={loading}
              placeholder="What's on your mind?"
              value={profile.status || ""}
              className="rounded-xl bg-muted/20"
              onChange={(e) => setProfile({ ...profile, status: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/40">
          <Button disabled={loading} onClick={handleSave} className="rounded-xl sm:w-auto w-full order-2 sm:order-1">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="rounded-xl sm:w-auto w-full gap-2 order-1 sm:order-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/10">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </main>
  );
}