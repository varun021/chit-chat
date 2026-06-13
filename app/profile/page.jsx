"use client";

import { useEffect, useState } from "react";

import {
  getCurrentProfile,
  updateProfile,
  uploadAvatar,
} from "@/services/chat";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

export default function ProfilePage() {
  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const data =
      await getCurrentProfile();

    setProfile(data);
  }

  async function handleAvatarChange(e) {
    try {
      const file =
        e.target.files?.[0];

      if (!file) return;

      setLoading(true);

      const avatarUrl =
        await uploadAvatar(file);

      setProfile((prev) => ({
        ...prev,
        avatar_url: avatarUrl,
      }));
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setLoading(true);

      const updated =
        await updateProfile({
          username:
            profile.username,
          full_name:
            profile.full_name,
          bio: profile.bio,
        });

      setProfile(updated);

      alert(
        "Profile updated successfully"
      );
    } catch {
      alert(
        "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        Profile
      </h1>

      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={profile.avatar_url}
          />

          <AvatarFallback>
            {profile.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <input
          type="file"
          accept="image/*"
          onChange={
            handleAvatarChange
          }
        />
      </div>

      <Input
        value={
          profile.username || ""
        }
        onChange={(e) =>
          setProfile({
            ...profile,
            username:
              e.target.value,
          })
        }
        placeholder="Username"
      />

      <Input
        value={
          profile.full_name || ""
        }
        onChange={(e) =>
          setProfile({
            ...profile,
            full_name:
              e.target.value,
          })
        }
        placeholder="Full Name"
      />

      <textarea
        className="w-full border rounded-md p-3"
        rows={4}
        value={profile.bio || ""}
        onChange={(e) =>
          setProfile({
            ...profile,
            bio:
              e.target.value,
          })
        }
      />

      <Button
        disabled={loading}
        onClick={handleSave}
      >
        {loading
          ? "Saving..."
          : "Save Profile"}
      </Button>
    </div>
  );
}