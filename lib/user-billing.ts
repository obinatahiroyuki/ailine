import { db } from "@/lib/db";
import { channelUserSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** LINEユーザーがチャネルで課金済み（有効なサブスク）か */
export async function isUserSubscriptionActive(
  lineChannelId: string,
  lineUserId: string
): Promise<boolean> {
  const [sub] = await db
    .select()
    .from(channelUserSubscriptions)
    .where(
      and(
        eq(channelUserSubscriptions.lineChannelId, lineChannelId),
        eq(channelUserSubscriptions.lineUserId, lineUserId)
      )
    );
  return sub?.status === "active";
}
