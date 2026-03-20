import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

type AuditParams = {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
};

export async function logAudit(params: AuditParams) {
  try {
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details ? JSON.stringify(params.details) : null,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
