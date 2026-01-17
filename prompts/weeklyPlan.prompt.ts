export function buildWeeklyPlanPrompt(input: {
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: string;
}) {
  return `
You are a backend service, not a chat assistant.

Your task is to OUTPUT VALID JSON ONLY.

ABSOLUTE RULES:
- Output MUST start with { and end with }
- NO markdown
- NO comments
- NO explanations
- NO trailing text
- NO backticks

If you break JSON, the system will reject your output.

JSON SCHEMA (MUST MATCH EXACTLY):

{
  "profile_summary": {
    "age": number,
    "height_cm": number,
    "weight_kg": number,
    "goal": string
  },
  "weekly_plan": {
    "days": [
      {
        "day": "Monday",
        "focus": string,
        "exercises": [
          {
            "name": string,
            "sets": number,
            "reps": string,
            "rest_seconds": number
          }
        ]
      }
    ]
  }
}

CONSTRAINTS:
- 3 to 5 training days
- Beginner friendly
- Gym-based
- Realistic exercises
- No extreme volume

USER DATA:
Age: ${input.age}
Height: ${input.height_cm}
Weight: ${input.weight_kg}
Goal: ${input.goal}

RETURN JSON ONLY.
`;
}
