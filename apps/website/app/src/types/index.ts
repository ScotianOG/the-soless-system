
// Frontend-specific types
export interface WalletInfo {
  address: string;
  balance: number;
}

export interface UserProfile {
  id: string;
  username?: string;
  walletAddress?: string;
  avatarUrl?: string;
}

export interface PresaleInfo {
  startDate: Date;
  endDate: Date;
  price: number;
  totalSupply: number;
  remaining: number;
}

export interface DocumentationSection {
  title: string;
  content: string;
  slug: string;
}

export interface SocialLink {
  platform: 'twitter' | 'discord' | 'telegram';
  url: string;
}

// Component prop types
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export interface CardProps {
  title: string;
  description: string;
  image?: string;
  link?: string;
}

// API response types (frontend only)
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'mint' | 'transfer' | 'stake';
  amount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}
