import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  channelDocuments,
  lineChannelContentAdmins,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";
import { parseDocument } from "@/lib/documents/parse";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lineChannelId } = await params;

  if (!lineChannelId) {
    return NextResponse.json({ error: "Channel ID required" }, { status: 400 });
  }

  const access = await checkChannelAccess(lineChannelId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "リクエストの解析に失敗しました" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { error: "ファイルを選択してください" },
      { status: 400 }
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "ファイルサイズは10MB以内にしてください" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await parseDocument(buffer, file.name, file.type);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (!result.text.trim()) {
    return NextResponse.json(
      {
        error:
          "ファイルからテキストを抽出できませんでした。空のファイルかもしれません。",
      },
      { status: 400 }
    );
  }

  try {
    await db.insert(channelDocuments).values({
      lineChannelId,
      filename: file.name,
      contentType: result.contentType,
      content: result.text,
    });

    revalidatePath(`/admin/channels/${lineChannelId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "保存に失敗しました" },
      { status: 500 }
    );
  }
}
