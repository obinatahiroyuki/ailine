"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  channelDocuments,
  lineChannelContentAdmins,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";
import { parseDocument } from "@/lib/documents/parse";

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

export async function uploadDocument(
  lineChannelId: string,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const access = await checkChannelAccess(lineChannelId);
  if ("error" in access) return { error: access.error };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "ファイルを選択してください" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "ファイルサイズは10MB以内にしてください" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseDocument(buffer, file.name, file.type);

  if (!result.ok) {
    return { error: result.error };
  }

  if (!result.text.trim()) {
    return { error: "ファイルからテキストを抽出できませんでした。空のファイルかもしれません。" };
  }

  try {
    await db.insert(channelDocuments).values({
      lineChannelId,
      filename: file.name,
      contentType: result.contentType,
      content: result.text,
    });

    revalidatePath(`/admin/channels/${lineChannelId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "保存に失敗しました" };
  }
}

export async function deleteDocument(
  lineChannelId: string,
  documentId: string
): Promise<{ success?: true; error?: string }> {
  const access = await checkChannelAccess(lineChannelId);
  if ("error" in access) return { error: access.error };

  try {
    const [doc] = await db
      .select()
      .from(channelDocuments)
      .where(
        and(
          eq(channelDocuments.id, documentId),
          eq(channelDocuments.lineChannelId, lineChannelId)
        )
      );

    if (!doc) {
      return { error: "ドキュメントが見つかりません" };
    }

    await db
      .delete(channelDocuments)
      .where(
        and(
          eq(channelDocuments.id, documentId),
          eq(channelDocuments.lineChannelId, lineChannelId)
        )
      );

    revalidatePath(`/admin/channels/${lineChannelId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "削除に失敗しました" };
  }
}
