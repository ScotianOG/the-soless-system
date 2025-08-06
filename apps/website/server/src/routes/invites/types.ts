// src/routes/invites/types.ts
export interface CreateInviteRequest {
  wallet: string;
}

export interface CreateInviteResponse {
  inviteLink: string;
}

export interface ClaimInviteRequest {
  code: string;
  newUserWallet: string;
}

export interface Invite {
  id: string;
  code: string;
  fullInviteLink: string;
  userId: string;
  used: boolean;
  usedCount: number;
  createdAt: Date;
  contestId?: string;
  claimsCount?: number;
}

export interface GetInvitesResponse {
  invites: Invite[];
}
