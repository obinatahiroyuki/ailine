"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ROLE_SYSTEM_ADMIN, ROLE_CONTENT_ADMIN } from "@/lib/auth";

export async function assignRole(userId: string, roleId: string, add: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };
  if (userId === session.user.id && roleId === ROLE_SYSTEM_ADMIN && !add) {
    return { error: "自分自身のシステム管理者ロールは削除できません" };
  }

  if (![ROLE_SYSTEM_ADMIN, ROLE_CONTENT_ADMIN].includes(roleId)) {
    return { error: "無効なロールです" };
  }

  try {
    if (add) {
      const [existing] = await db
        .select()
        .from(userRoles)
        .where(
          and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId))
        );
      if (!existing) {
        await db.insert(userRoles).values({ userId, roleId });
        await logAudit({
          userId: session.user.id,
          action: "role.assign",
          resource: "user",
          resourceId: userId,
          details: { roleId },
        });
      }
    } else {
      await db
        .delete(userRoles)
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId)
          )
        );
      await logAudit({
        userId: session.user.id,
        action: "role.remove",
        resource: "user",
        resourceId: userId,
        details: { roleId },
      });
    }
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "ロールの更新に失敗しました" };
  }
}
