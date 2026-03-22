"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { lineChannels, lineChannelContentAdmins } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";

export async function updateChannelName(
  lineChannelId: string,
  name: string | null
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };

  const [adminLink] = await db
    .select()
    .from(lineChannelContentAdmins)
    .where(
      and(
        eq(lineChannelContentAdmins.lineChannelId, lineChannelId),
        eq(lineChannelContentAdmins.userId, session.user.id)
      )
    );

  if (!adminLink && !isSystemAdmin(session)) {
    return { error: "権限がありません" };
  }

  try {
    await db
      .update(lineChannels)
      .set({
        name: name?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(lineChannels.id, lineChannelId));
    revalidatePath(`/admin/channels/${lineChannelId}`);
    revalidatePath("/admin/channels");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "更新に失敗しました" };
  }
}
