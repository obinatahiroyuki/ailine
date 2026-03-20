"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { aiProviders, lineChannelContentAdmins } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptApiKey } from "@/lib/ai/encrypt";
import { isSystemAdmin } from "@/lib/auth";

type AiProviderType = "openai" | "anthropic" | "google";

export async function saveAiProvider(
  lineChannelId: string,
  formData: FormData
) {
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

  const provider = formData.get("provider")?.toString() as AiProviderType;
  const apiKey = formData.get("apiKey")?.toString()?.trim();
  const model = formData.get("model")?.toString()?.trim();

  if (!provider || !model) {
    return { error: "プロバイダーとモデルは必須です" };
  }

  if (!["openai", "anthropic", "google"].includes(provider)) {
    return { error: "無効なプロバイダーです" };
  }

  try {
    const [existing] = await db
      .select()
      .from(aiProviders)
      .where(eq(aiProviders.lineChannelId, lineChannelId));

    const apiKeyEncrypted = apiKey
      ? encryptApiKey(apiKey)
      : existing?.apiKeyEncrypted;

    if (!apiKeyEncrypted) {
      return { error: "APIキーは必須です" };
    }

    if (existing) {
      await db
        .update(aiProviders)
        .set({
          provider,
          apiKeyEncrypted,
          model,
          updatedAt: new Date(),
        })
        .where(eq(aiProviders.id, existing.id));
    } else {
      await db.insert(aiProviders).values({
        lineChannelId,
        provider,
        apiKeyEncrypted,
        model,
      });
    }

    revalidatePath(`/admin/channels/${lineChannelId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "保存に失敗しました" };
  }
}
