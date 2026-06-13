importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBeTP3VbmCO96zYd8GU_Wbe5tUzSWwH-po",
  authDomain: "chitchat-b904c.firebaseapp.com",
  projectId: "chitchat-b904c",
  storageBucket: "chitchat-b904c.firebasestorage.app",
  messagingSenderId: "817191332032",
  appId: "1:817191332032:web:8040aa341bad9af9fee525",
});

const messaging =
  firebase.messaging();
messaging.onBackgroundMessage(
  (payload) => {
    self.registration.showNotification(
      payload.data.title,
      {
        body:
          payload.data.body,

        icon:
          payload.data
            .avatarUrl ||
          "/icon-192.png",

        badge:
          "/icon-192.png",

        tag:
          payload.data
            .conversationId,

        renotify: true,

        data: {
          conversationId:
            payload.data
              .conversationId,
        },
      }
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    event.waitUntil(
      clients.openWindow(
        `/chat?conversation=${event.notification.data.conversationId}`
      )
    );
  }
);