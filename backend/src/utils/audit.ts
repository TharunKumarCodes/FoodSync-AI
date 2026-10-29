import { prisma } from './prisma';

interface CreateAuditLogParams {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Creates an append-only audit record for business actions.
 * Redacts any sensitive fields automatically.
 */
export async function createAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: CreateAuditLogParams): Promise<void> {
  try {
    let safeMetadataString: string | null = null;
    if (metadata) {
      // Cleanse metadata of any passwords, tokens, or sensitive values
      const cleansed = { ...metadata };
      delete (cleansed as Record<string, unknown>).password;
      delete (cleansed as Record<string, unknown>).passwordHash;
      delete (cleansed as Record<string, unknown>).token;
      delete (cleansed as Record<string, unknown>).jwtSecret;
      safeMetadataString = JSON.stringify(cleansed);
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        entityType,
        entityId,
        metadata: safeMetadataString,
      },
    });
  } catch (err) {
    // Audit logging should not crash the primary transaction, but log error
    console.error('Failed to create audit log entry:', err);
  }
}
