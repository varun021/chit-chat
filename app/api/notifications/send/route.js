import { NextResponse } from "next/server";

import { messaging } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const {
      token,
      title,
      body,
      conversationId,
    } = await request.json();

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Missing FCM token",
        },
        { status: 400 }
      );
    }

    const response =
      await messaging.send({
        token,

        notification: {
          title,
          body,
        },

        data: {
          conversationId:
            String(
              conversationId
            ),
        },
      });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error.message,
      },
      { status: 500 }
    );
  }
}