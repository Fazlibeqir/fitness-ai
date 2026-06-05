const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const DEFAULT_MODELS = [
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL,
  ...(process.env.EXPO_PUBLIC_OPENROUTER_FALLBACK_MODELS || "").split(","),
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct",
].filter((model): model is string => Boolean(model && model.trim()));

if (!OPENROUTER_API_KEY) {
  console.warn(
    "Missing OpenRouter API key!\n" +
      "Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file"
  );
}

export async function callOpenRouter(
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.2,
  models: string[] = DEFAULT_MODELS
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key is not configured. Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file"
    );
  }

  const messages: Array<{ role: string; content: string }> = systemPrompt
    ? [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]
    : [{ role: "user", content: prompt }];

  let lastError: unknown = null;

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + OPENROUTER_API_KEY,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",
          "X-Title": "FitnessAI",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenRouter API error (${model}): ${res.status} - ${errorText}`);
      }

      const json = await res.json();

      if (!json.choices || !json.choices[0]) {
        throw new Error(`Invalid response from OpenRouter API (${model})`);
      }

      return json.choices[0].message.content;
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes("Network request failed")) {
        throw new Error("Network error: Check your internet connection and try again");
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter request failed");
}

// Legacy function for backward compatibility
export async function callWeeklyPlanner(prompt: string) {
  return callOpenRouter(prompt);
}

export async function callStructuredOpenRouter(
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.2
) {
  return callOpenRouter(prompt, systemPrompt, temperature, DEFAULT_MODELS);
}
