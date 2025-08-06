// src/routes/registration/types.ts

export interface RegistrationConfig {
  START_DATE: string;
  MAINTENANCE_MODE: boolean;
}

export interface RegistrationStatus {
  isOpen: boolean;
  totalRegistrations: number;
  registrationPeriod: {
    start: string;
  };
  currentTime: string;
  maintenanceMode: boolean;
  reason: string | null;
}

export interface PlatformConnection {
  linked: boolean;
  platformId?: string;
  username?: string;
  verificationCode?: string;
}

export interface RegistrationRequest {
  wallet: string;
  platforms: {
    telegram: PlatformConnection;
    discord: PlatformConnection;
    twitter: PlatformConnection;
  };
}
