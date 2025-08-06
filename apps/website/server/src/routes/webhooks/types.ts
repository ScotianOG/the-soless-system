export interface DiscordInteraction {
  type: number;
  member: {
    user: {
      id: string;
    };
  };
  data?: {
    name?: string;
    options?: any[];
    component_type?: number;
    custom_id?: string;
  };
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    username?: string;
  };
  text?: string;
}

export interface TelegramChatMember {
  from: {
    id: number;
  };
  new_chat_member?: {
    status: string;
    user: {
      id: number;
    };
  };
}

export interface TelegramUpdate {
  message?: TelegramMessage;
  chat_member?: TelegramChatMember;
}

export interface TwitterUser {
  id_str: string;
}

export interface Tweet {
  id_str: string;
  user: TwitterUser;
  text: string;
  created_at: string;
}

export interface TwitterEvent {
  tweet_create_events?: Tweet[];
}
