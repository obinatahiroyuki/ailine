"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { prompts, lineChannelContentAdmins } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";

export async function savePrompt(lineChannelId: string, formData: FormData) {
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
        eq(lineChannelContentAdmins.lineChannelId, lineChannelId),
        eq(lineChannelContentAdmins.userId, session.user.id)
      )
    );

  if (!admin && !sysAdmin) {
    return { error: "権限がありません" };
  }

  const systemPrompt = formData.get("systemPrompt")?.toString() ?? "";
  const contextTurns = Math.min(
    50,
    Math.max(1, parseInt(formData.get("contextTurns")?.toString() ?? "15", 10))
  );
  const summaryMessageCount = Math.min(
    100,
    Math.max(5, parseInt(formData.get("summaryMessageCount")?.toString() ?? "20", 10))
  );
  const maxResponseChars = Math.min(
    5000,
    Math.max(100, parseInt(formData.get("maxResponseChars")?.toString() ?? "5000", 10))
  );
  const fullContextInterval = Math.min(
    100,
    Math.max(0, parseInt(formData.get("fullContextInterval")?.toString() ?? "0", 10))
  );

  try {
    await db
      .update(prompts)
      .set({
        systemPrompt,
        contextTurns,
        summaryMessageCount,
        maxResponseChars,
        fullContextInterval,
        updatedAt: new Date(),
      })
      .where(eq(prompts.lineChannelId, lineChannelId));

    revalidatePath(`/admin/channels/${lineChannelId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "保存に失敗しました" };
  }
}
