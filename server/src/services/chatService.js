/**
 * Chat Service - OpenRouter Integration
 * Uses OpenRouter API to access various AI models
 */

const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value || !value.trim()) {
    throw new Error(`${key} is required and must be set`);
  }
  return value;
};

const buildSystemPrompt =
  () => `You are a Smart City Assistant for a complaint management system.
You help CITIZEN, OPERATOR, and ADMIN users.
Answer using only the provided data.
Do not make assumptions or hallucinate.
If data is missing, say "I don't have that information right now."
Keep responses short, clear, and human-friendly.
Explain statuses only when useful:
- PENDING = waiting for assignment
- ASSIGNED = operator assigned
- IN_PROGRESS = work started
- RESOLVED = issue fixed
Return plain text only.`;

const buildUserPrompt = ({ role, context, message }) =>
  `Role: ${role}

Data:
${JSON.stringify(context, null, 2)}

User Question:
${message}`;

const generateChatResponse = async ({ role, context, message }) => {
  try {
    const apiKey = getRequiredEnv("OPENROUTER_API_KEY");
    const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-2-7b-chat";

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:5000",
          "X-Title": "Smart City Chat",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(),
            },
            {
              role: "user",
              content: buildUserPrompt({ role, context, message }),
            },
          ],
          temperature: 0.2,
          max_tokens: 220,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      const upstreamMessage =
        errorData.error?.message || `HTTP ${response.status}`;
      const error = new Error(upstreamMessage);
      error.status =
        response.status === 401 || response.status === 403 ? 502 : response.status;
      error.code =
        response.status === 401 || response.status === 403
          ? "CHAT_PROVIDER_AUTH_ERROR"
          : errorData.error?.code || "OPENROUTER_ERROR";
      error.userMessage =
        response.status === 401 || response.status === 403
          ? "Chat assistant is temporarily unavailable due to provider configuration."
          : upstreamMessage;
      throw error;
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      const error = new Error("AI response was empty");
      error.status = 502;
      error.code = "EMPTY_AI_RESPONSE";
      throw error;
    }

    return reply;
  } catch (error) {
    console.error("Chat service error:", error.message);
    throw error;
  }
};

module.exports = {
  generateChatResponse,
};
