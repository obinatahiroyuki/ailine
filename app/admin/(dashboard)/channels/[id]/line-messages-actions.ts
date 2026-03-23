"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  lineChannelContentAdmins,
} from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";

async function checkChannelAccess(lineChannelId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" as const };

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
    return { error: "権限がありません" as const };
  }
  return { ok: true as const };
}

const ROLE_LABELS: Record<string, string> = {
  user: "ユーザー",
  assistant: "アシスタント",
  system: "システム",
};

export async function downloadLineMessages(
  lineChannelId: string,
  lineUserIds: string[],
  displayNames: Record<string, string | null>
): Promise<{ error?: string; text?: string }> {
  const access = await checkChannelAccess(lineChannelId);
  if ("error" in access) return { error: access.error };

  if (lineUserIds.length === 0) {
    return { error: "ダウンロードするユーザーを選択してください" };
  }

  const convos = await db
    .select({ id: conversations.id, lineUserId: conversations.lineUserId })
    .from(conversations)
    .where(
      and(
        eq(conversations.lineChannelId, lineChannelId),
        inArray(conversations.lineUserId, lineUserIds)
      )
    );

  const convIds = convos.map((c) => c.id);
  if (convIds.length === 0) {
    return { text: "選択したユーザーにメッセージがありません。" };
  }

  const msgs = await db
    .select({
      conversationId: messages.conversationId,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(inArray(messages.conversationId, convIds))
    .orderBy(asc(messages.createdAt));

  const convToUser = new Map(convos.map((c) => [c.id, c.lineUserId]));

  const byUser = new Map<string, typeof msgs>();
  for (const m of msgs) {
    const uid = convToUser.get(m.conversationId);
    if (!uid) continue;
    const list = byUser.get(uid) ?? [];
    list.push(m);
    byUser.set(uid, list);
  }

  const lines: string[] = [];
  const sortedUserIds = [...new Set(lineUserIds)];

  for (const lineUserId of sortedUserIds) {
    const userMsgs = byUser.get(lineUserId);
    if (!userMsgs || userMsgs.length === 0) continue;

    const name = displayNames[lineUserId] ?? null;
    const header = name
      ? `=== ${name} (${lineUserId}) ===`
      : `=== ${lineUserId} ===`;
    lines.push(header);
    lines.push("");

    for (const m of userMsgs) {
      const dt = new Date(m.createdAt).toLocaleString("ja-JP", {
        dateStyle: "short",
        timeStyle: "medium",
      });
      const label = ROLE_LABELS[m.role] ?? m.role;
      lines.push(`[${dt}] ${label}: ${m.content.replace(/\n/g, " ")}`);
    }
    lines.push("");
  }

  if (lines.length === 0) {
    return { text: "選択したユーザーにメッセージがありません。" };
  }

  const text = lines.join("\n");
  return { text };
}
