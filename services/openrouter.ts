const OPENROUTER_API_KEY =
  process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn(
    "Missing OpenRouter API key!\n" +
    "Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file"
  );
}

export async function callOpenRouter(
  prompt: string,
  systemPrompt?: string,
  temperature: number = 0.2
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is not configured. Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file");
  }

  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "FitnessAI",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages,
        temperature,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter API error: ${res.status} - ${errorText}`);
    }

    const json = await res.json();

    if (!json.choices || !json.choices[0]) {
      throw new Error("Invalid response from OpenRouter API");
    }

    return json.choices[0].message.content;
  } catch (error: any) {
    if (error.message.includes("Network request failed")) {
      throw new Error("Network error: Check your internet connection and try again");
    }
    throw error;
  }
}

// Legacy function for backward compatibility
export async function callWeeklyPlanner(prompt: string) {
  return callOpenRouter(prompt);
}
