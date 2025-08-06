const isProd = process.env.NODE_ENV === "production";

export const logger = {
  error: (message: string, error?: any) => {
    if (!isProd) {
      console.error(message, error);
    }
  },

  warn: (message: string, data?: any) => {
    if (!isProd) {
      console.warn(message, data);
    }
  },

  info: (message: string, data?: any) => {
    if (!isProd) {
      console.log(message, data);
    }
  },
};
