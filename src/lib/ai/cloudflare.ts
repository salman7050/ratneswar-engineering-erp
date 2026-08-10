import "server-only";

export type CloudAiMessage = { role: "system" | "user" | "assistant"; content: string };

interface CloudflareAiResponse {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: { response?: string } | string;
}

export function cloudAiConfigured() {
  return Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_API_TOKEN);
}

export async function callCloudflareAI(
  messages: CloudAiMessage[],
  model = process.env.CLOUDFLARE_AI_MODEL || "@cf/zai-org/glm-4.7-flash"
): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_AI_API_TOKEN;
  if (!accountId || !token) throw new Error("Cloud AI is not configured yet. Add the Cloudflare account ID and AI API token in hosting environment variables.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages, temperature: 0.1 }),
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({})) as CloudflareAiResponse;
    if (!response.ok || payload.success === false) {
      const reason = payload.errors?.map((e) => e.message).filter(Boolean).join("; ") || `HTTP ${response.status}`;
      throw new Error(`Cloud AI request failed: ${reason}`);
    }

    const result = payload.result;
    const text = typeof result === "string" ? result : result?.response;
    if (!text?.trim()) throw new Error("Cloud AI returned an empty response.");
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}
