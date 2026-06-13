import { NextResponse } from "next/server";
import { messaging } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const {
      token,
      title,
      body,
      avatarUrl,
      conversationId,
    } = await request.json();

    const response =
      await messaging.send({
        token,

        data: {
          title,
          body,
          avatarUrl:
            avatarUrl || "",
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
    console.error(
      "Notification Error:",
      error
    );

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}