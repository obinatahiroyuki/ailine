"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userRoles, users } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { isSystemAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ROLE_SYSTEM_ADMIN, ROLE_CONTENT_ADMIN } from "@/lib/auth";
import bcrypt from "bcryptjs";

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

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  const email = formData.get("email")?.toString()?.trim()?.toLowerCase();
  const name = formData.get("name")?.toString()?.trim();
  const password = formData.get("password")?.toString();

  if (!email) return { error: "メールアドレスを入力してください" };
  if (!password || password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください" };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return { error: "このメールアドレスは既に登録されています" };

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name: name || null,
        password: passwordHash,
      })
      .returning();

    if (!user) return { error: "ユーザーの作成に失敗しました" };

    await db.insert(userRoles).values({
      userId: user.id,
      roleId: ROLE_CONTENT_ADMIN,
    });

    await logAudit({
      userId: session.user.id,
      action: "user.create",
      resource: "user",
      resourceId: user.id,
      details: { email },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "ユーザーの作成に失敗しました" };
  }
}

export async function setUserBillingExempt(
  userId: string,
  exempt: boolean
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  try {
    await db
      .update(users)
      .set({ billingExempt: exempt, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await logAudit({
      userId: session.user.id,
      action: "user.billing_exempt_updated",
      resource: "user",
      resourceId: userId,
      details: { exempt },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "更新に失敗しました" };
  }
}

export async function setAllUsersBillingExempt(
  exempt: boolean,
  userIds: string[]
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  if (userIds.length === 0) return { success: true };

  try {
    await db
      .update(users)
      .set({
        billingExempt: exempt,
        updatedAt: new Date(),
      })
      .where(inArray(users.id, userIds));

    await logAudit({
      userId: session.user.id,
      action: "users.billing_exempt_bulk",
      resource: "user",
      details: { exempt, count: userIds.length },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "一括更新に失敗しました" };
  }
}

export async function resetUserPassword(
  targetUserId: string,
  newPassword: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };

  if (!newPassword || newPassword.length < 8) {
    return { error: "パスワードは8文字以上で入力してください" };
  }

  const [targetUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, targetUserId));
  if (!targetUser) return { error: "ユーザーが見つかりません" };

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    await logAudit({
      userId: session.user.id,
      action: "user.password_reset",
      resource: "user",
      resourceId: targetUserId,
      details: { targetEmail: targetUser.email },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "パスワードの変更に失敗しました" };
  }
}

export async function updateOwnName(name: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };

  const trimmed = name?.trim() ?? "";
  if (!trimmed) return { error: "名前を入力してください" };

  try {
    await db
      .update(users)
      .set({ name: trimmed, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    revalidatePath("/admin/account");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "名前の変更に失敗しました" };
  }
}

export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };

  if (!newPassword || newPassword.length < 8) {
    return { error: "新しいパスワードは8文字以上で入力してください" };
  }

  const [user] = await db
    .select({ id: users.id, password: users.password })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user) return { error: "ユーザーが見つかりません" };
  if (!user.password) {
    return {
      error: "メール・パスワードでログインしていません。Googleでログイン中の場合は、システム管理者にパスワードを設定してもらってください。",
    };
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "現在のパスワードが正しくありません" };

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    revalidatePath("/admin/account");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "パスワードの変更に失敗しました" };
  }
}

export async function deleteUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "ログインが必要です" };
  if (!isSystemAdmin(session)) return { error: "権限がありません" };
  if (userId === session.user.id) return { error: "自分自身は削除できません" };

  const sysAdmins = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(eq(userRoles.roleId, ROLE_SYSTEM_ADMIN));

  const isTargetSystemAdmin = sysAdmins.some((r) => r.userId === userId);
  if (isTargetSystemAdmin && sysAdmins.length <= 1) {
    return { error: "最後のシステム管理者は削除できません" };
  }

  try {
    await db.delete(users).where(eq(users.id, userId));

    await logAudit({
      userId: session.user.id,
      action: "user.delete",
      resource: "user",
      resourceId: userId,
      details: {},
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "ユーザーの削除に失敗しました" };
  }
}
