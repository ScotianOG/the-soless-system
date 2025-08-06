// src/lib/api/invites.ts
import { apiClient } from './client';
import { Invite } from './types';

interface CreateInviteResponse {
  inviteLink: string;
}

interface ClaimInviteResponse {
  success: boolean;
  message?: string;
}

interface GetUserInvitesResponse {
  success: boolean;
  invites: Invite[];
}

export const invitesApi = {
  createInvite: (wallet: string) =>
    apiClient
      .post<CreateInviteResponse>('/invites/create', { wallet })
      .then(res => res.data),

  claimInvite: (inviteCode: string, telegramUserId: string, telegramUsername?: string) =>
    apiClient
      .post<ClaimInviteResponse>('/invites/claim', { 
        inviteCode, 
        telegramUserId,
        telegramUsername 
      })
      .then(res => res.data),

  getUserInvites: (wallet: string) =>
    apiClient
      .get<GetUserInvitesResponse>(`/invites/user/${wallet}`)
      .then(res => res.data),
};
