const OPENROUTER_API_KEY =
  process.env.EXPO_PUBLIC_OPENROUTER_API_KEY!;

export async function callWeeklyPlanner(prompt: string) {
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
      messages: [{ role: "system", content: prompt }],
      temperature: 0.2,
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message || "OpenRouter error");
  }

  return json.choices[0].message.content;
}
