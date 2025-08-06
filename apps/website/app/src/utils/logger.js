const isProd = process.env.NODE_ENV === "production";
export const logger = {
    error: (message, error) => {
        if (!isProd) {
            console.error(message, error);
        }
    },
    warn: (message, data) => {
        if (!isProd) {
            console.warn(message, data);
        }
    },
    info: (message, data) => {
        if (!isProd) {
            console.log(message, data);
        }
    },
};
