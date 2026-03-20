import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lineChannels, webhookEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getLineSignature,
  verifyLineSignature,
} from "@/lib/line/verify-signature";
import { inngest } from "@/inngest/client";
import { replyToLine } from "@/lib/line/reply";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

type WebhookEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
  webhookEventId?: string;
  source?: { type: string; userId?: string; groupId?: string };
};

type WebhookBody = {
  destination: string;
  events: WebhookEvent[];
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  if (!channelId) {
    return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
  }

  const rawBody = await request.text();
  const signature = getLineSignature(request);

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-line-signature header" },
      { status: 401 }
    );
  }

  const [channel] = await db
    .select()
    .from(lineChannels)
    .where(eq(lineChannels.channelId, channelId));

  if (!channel) {
    console.warn("Webhook received for unregistered channel:", channelId);
    return NextResponse.json({ ok: true });
  }

  const valid = verifyLineSignature(
    rawBody,
    channel.channelSecret,
    signature
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.events || !Array.isArray(body.events)) {
    return NextResponse.json({ ok: true });
  }

  const eventsToProcess: { channelId: string; lineUserId: string; text: string; replyToken: string }[] = [];

  for (const event of body.events) {
    if (event.webhookEventId) {
      const [existing] = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.webhookEventId, event.webhookEventId));

      if (existing) {
        continue;
      }

      try {
        await db.insert(webhookEvents).values({
          webhookEventId: event.webhookEventId,
          lineChannelId: channel.id,
        });
      } catch {
        continue;
      }
    }

    if (event.type === "message") {
      const replyToken = event.replyToken;
      if (!replyToken) continue;

      if (event.message?.type === "text") {
        const text = event.message.text ?? "";
        const lineUserId = event.source?.userId;
        if (lineUserId) {
          eventsToProcess.push({ channelId, lineUserId, text, replyToken });
        }
      } else {
        await replyToLine(
          channel.accessToken,
          replyToken,
          "テキストでメッセージを送ってください。"
        );
      }
    }
  }

  if (eventsToProcess.length > 0) {
    await inngest.send(
      eventsToProcess.map((e) => ({
        name: "line/message.received",
        data: e,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
