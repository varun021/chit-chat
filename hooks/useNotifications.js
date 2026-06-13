"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { updateFCMToken } from "@/services/chat";

export default function useNotifications() {
  useEffect(() => {
    async function init() {
      try {
        console.log("Notification supported:", !!window.Notification);
        console.log("Messaging instance:", messaging);

        const permission =
          await Notification.requestPermission();

        console.log("Permission:", permission);

        if (permission !== "granted") {
          return;
        }

        const token = await getToken(
          messaging,
          {
            vapidKey:
              process.env
                .NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          }
        );

        console.log("Generated token:", token);

        if (!token) return;

        await updateFCMToken(token);

        console.log(
          "FCM Token saved:",
          token
        );
      } catch (error) {
        console.error(
          "FCM Error:",
          error
        );
      }
    }

    init();
  }, []);
}