import { createHmac } from "crypto";

const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

/**
 * Verifies a Twitter webhook request using HMAC SHA-256
 * @param signature The signature from the X-Twitter-Webhooks-Signature header
 * @param body The raw request body
 * @returns Promise<boolean> Whether the webhook is valid
 */
export async function verifyTwitterWebhook(
  signature: string,
  body: string
): Promise<boolean> {
  try {
    if (!TWITTER_API_SECRET) {
      return false;
    }

    const expectedSignature = createHmac("sha256", TWITTER_API_SECRET)
      .update(body)
      .digest("base64");

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error("Twitter webhook verification failed:", error);
    return false;
  }
}
