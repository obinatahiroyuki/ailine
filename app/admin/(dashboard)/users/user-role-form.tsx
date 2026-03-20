"use client";

import { useState } from "react";
import { assignRole } from "./actions";
import { ROLE_SYSTEM_ADMIN, ROLE_CONTENT_ADMIN } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  [ROLE_SYSTEM_ADMIN]: "システム管理者",
  [ROLE_CONTENT_ADMIN]: "コンテンツ管理者",
};

export function UserRoleForm({
  userId,
  currentRoles,
  isSelf,
}: {
  userId: string;
  currentRoles: string[];
  isSelf: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  async function toggleRole(roleId: string, add: boolean) {
    setError(null);
    const result = await assignRole(userId, roleId, add);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[ROLE_SYSTEM_ADMIN, ROLE_CONTENT_ADMIN].map((roleId) => {
        const hasRole = currentRoles.includes(roleId);
        const isSystemAdminSelf = isSelf && roleId === ROLE_SYSTEM_ADMIN;
        return (
          <span
            key={roleId}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
              hasRole
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {ROLE_LABELS[roleId]}
            {(!isSystemAdminSelf || !hasRole) && (
              <button
                type="button"
                onClick={() => toggleRole(roleId, !hasRole)}
                className="ml-1 hover:opacity-80"
                title={hasRole ? "ロールを削除" : "ロールを付与"}
              >
                {hasRole ? "×" : "+"}
              </button>
            )}
          </span>
        );
      })}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
