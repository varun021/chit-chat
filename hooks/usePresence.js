import { useEffect, useRef } from "react";
import useChatStore from "@/store/chatStore";
import {
  setUserOnline,
  setUserOffline,
  subscribeToProfiles,
  unsubscribe,
} from "@/services/chat";

export function usePresence() {
  const currentUserId = useChatStore((state) => state.currentUserId);
  const updateProfile = useChatStore((state) => state.updateProfile);
  const profilesChannelRef = useRef(null);
  const onlineStatusSetRef = useRef(false);

  useEffect(() => {
    if (!currentUserId) return;

    let channel;

    async function initializePresence() {
      try {
        await setUserOnline(currentUserId);
        onlineStatusSetRef.current = true;

        channel = subscribeToProfiles((profile) => {
          if (profile && profile.id) {
            updateProfile(profile.id, {
              is_online: profile.is_online,
              last_seen: profile.last_seen,
            });
          }
        });

        profilesChannelRef.current = channel;
      } catch (error) {
        console.error("Failed to initialize presence:", error);
      }
    }

    initializePresence();

    const handleBeforeUnload = async () => {
      if (onlineStatusSetRef.current) {
        try {
          await setUserOffline(currentUserId);
        } catch (error) {
          console.error("Error setting user offline:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      handleBeforeUnload();

      if (profilesChannelRef.current) {
        unsubscribe(profilesChannelRef.current);
        profilesChannelRef.current = null;
      }
    };
  }, [currentUserId, updateProfile]);
}
