// src/lib/api/registration.ts
import { apiClient } from './client';

export const registrationApi = {
  getStatus: () =>
    apiClient.get('/registration/status').then(res => res.data),

  register: (data: { wallet: string; platforms: any }) =>
    apiClient.post('/registration/register', data).then(res => res.data),
};
