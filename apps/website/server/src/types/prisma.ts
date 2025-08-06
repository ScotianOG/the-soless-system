/**
 * Extended types for handling custom fields in the database that
 * may not be defined in the Prisma schema yet
 */

export interface ExtendedInviteLink {
  id: string;
  code: string;
  userId: string;
  used: boolean;
  fullInviteLink?: string;
  usedCount?: number;
  createdAt?: Date;
  usedBy?: string | null;
  usedAt?: Date | null;
  contestId?: string | null;
}

export interface InviteWithClaimCount extends ExtendedInviteLink {
  claims_count: string | number;
}
