import { inngest } from "./client";
import { handleLineMessage } from "@/lib/line/chat-handler";
import { replyToLine } from "@/lib/line/reply";
import { db } from "@/lib/db";
import { lineChannels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const processLineMessage = inngest.createFunction(
  {
    id: "process-line-message",
    retries: 3,
    triggers: [{ event: "line/message.received" }],
  },
  async ({ event }) => {
    const { channelId, lineUserId, text, replyToken } = event.data;
    try {
      await handleLineMessage(channelId, lineUserId, text, replyToken);
      return { ok: true };
    } catch (err) {
      console.error("Chat handler error:", err);
      const [channel] = await db
        .select()
        .from(lineChannels)
        .where(eq(lineChannels.channelId, channelId));
      if (channel) {
        await replyToLine(
          channel.accessToken,
          replyToken,
          "申し訳ありません。処理中にエラーが発生しました。"
        );
      }
      return { ok: false, error: String(err) };
    }
  }
);
