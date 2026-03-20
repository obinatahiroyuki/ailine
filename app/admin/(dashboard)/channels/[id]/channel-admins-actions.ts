"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  lineChannelContentAdmins,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function addChannelAdmin(lineChannelId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { error: "メールアドレスを入力してください" };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, trimmed));

  if (!user) return { error: "このメールアドレスのユーザーが見つかりません" };

  const [existing] = await db
    .select()
    .from(lineChannelContentAdmins)
    .where(
      and(
        eq(lineChannelContentAdmins.lineChannelId, lineChannelId),
        eq(lineChannelContentAdmins.userId, user.id)
      )
    );

  if (existing) return { error: "既にこのチャネルの管理者です" };

  try {
    await db.insert(lineChannelContentAdmins).values({
      lineChannelId,
      userId: user.id,
    });
    await logAudit({
      userId: session.user.id,
      action: "channel_admin.add",
      resource: "line_channel",
      resourceId: lineChannelId,
      details: { targetUserId: user.id, targetEmail: user.email },
    });
    revalidatePath(`/admin/channels/${lineChannelId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "追加に失敗しました" };
  }
}

export async function removeChannelAdmin(
  lineChannelId: string,
  userId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  const admins = await db
    .select()
    .from(lineChannelContentAdmins)
    .where(eq(lineChannelContentAdmins.lineChannelId, lineChannelId));

  if (admins.length <= 1) {
    return { error: "最後の1人は削除できません" };
  }

  try {
    await db
      .delete(lineChannelContentAdmins)
      .where(
        and(
          eq(lineChannelContentAdmins.lineChannelId, lineChannelId),
          eq(lineChannelContentAdmins.userId, userId)
        )
      );
    await logAudit({
      userId: session.user.id,
      action: "channel_admin.remove",
      resource: "line_channel",
      resourceId: lineChannelId,
      details: { targetUserId: userId },
    });
    revalidatePath(`/admin/channels/${lineChannelId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "削除に失敗しました" };
  }
}
