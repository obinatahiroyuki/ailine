"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannels,
  lineChannelContentAdmins,
  prompts,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function createLineChannel(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "ログインが必要です" };
  }

  const channelId = formData.get("channelId")?.toString()?.trim();
  const channelSecret = formData.get("channelSecret")?.toString()?.trim();
  const accessToken = formData.get("accessToken")?.toString()?.trim();

  if (!channelId || !channelSecret || !accessToken) {
    return { error: "チャネルID、チャネルシークレット、アクセストークンは必須です" };
  }

  try {
    const [existing] = await db
      .select()
      .from(lineChannels)
      .where(eq(lineChannels.channelId, channelId));

    if (existing) {
      return { error: "このチャネルIDは既に登録されています" };
    }

    const [channel] = await db
      .insert(lineChannels)
      .values({
        channelId,
        channelSecret,
        accessToken,
      })
      .returning();

    if (!channel) {
      return { error: "チャネルの作成に失敗しました" };
    }

    await db.insert(lineChannelContentAdmins).values({
      lineChannelId: channel.id,
      userId: session.user.id,
    });

    await db.insert(prompts).values({
      lineChannelId: channel.id,
    });

    await logAudit({
      userId: session.user.id,
      action: "channel.create",
      resource: "line_channel",
      resourceId: channel.id,
      details: { channelId },
    });

    revalidatePath("/admin/channels");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "チャネルの登録に失敗しました" };
  }
}

export async function deleteLineChannel(channelId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "ログインが必要です" };
  }

  const sysAdmin = isSystemAdmin(session);
  const [admin] = await db
    .select()
    .from(lineChannelContentAdmins)
    .where(
      and(
        eq(lineChannelContentAdmins.lineChannelId, channelId),
        eq(lineChannelContentAdmins.userId, session.user.id)
      )
    );

  if (!admin && !sysAdmin) {
    return { error: "このチャネルを削除する権限がありません" };
  }

  const [ch] = await db
    .select({ channelId: lineChannels.channelId })
    .from(lineChannels)
    .where(eq(lineChannels.id, channelId));

  try {
    await db.delete(lineChannels).where(eq(lineChannels.id, channelId));

    await logAudit({
      userId: session.user.id,
      action: "channel.delete",
      resource: "line_channel",
      resourceId: channelId,
      details: ch ? { channelId: ch.channelId } : undefined,
    });

    revalidatePath("/admin/channels");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "チャネルの削除に失敗しました" };
  }
}
