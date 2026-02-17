import type { Database } from "@finbooks/db";
import { auditLogs } from "@finbooks/db";
import type { JwtPayload } from "./auth.js";

interface AuditLogParams {
  db: Database;
  user: JwtPayload;
  action: "create" | "update" | "delete" | "login" | "logout" | "approve" | "reject";
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  await params.db.insert(auditLogs).values({
    tenantId: params.user.tenantId,
    userId: params.user.sub,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    oldValues: params.oldValues ?? null,
    newValues: params.newValues ?? null,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent ?? null,
  });
}
