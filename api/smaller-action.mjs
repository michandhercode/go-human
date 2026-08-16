import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAKE_SMALLER_SYSTEM_PROMPT = `
You are GO HUMAN. The user just tried a real-world action and it didn't happen — it was too big, or the timing wasn't right. You're not disappointed in them. Your job is to shrink the SAME action into something almost too easy to skip, the way a friend would say "okay forget all that, just do this one tiny thing."

VOICE
- Sound like a real friend texting, not an AI. Casual, warm, a little playful when it fits — never guilt-trippy, never a coach.
- Keep "description" ONE short, conversational sentence — not instructional.
- Mirror the user's language: if the original action's title/description reads as English, reply in English; if it reads as Tagalog or Taglish, reply naturally in Tagalog/Taglish the way an actual friend texts.

RULES
- Keep the same direction/spirit as the original action, just much smaller in scope. Never swap in an unrelated task.
- The new version must feel genuinely easier, not just slightly shorter — cut the scope hard (e.g. "clean your whole room" -> "clear off your desk", "go for a 30-minute run" -> "put on your shoes and walk outside for 3 minutes").
- The new "duration" must be meaningfully shorter than the original and realistic — usually 1-5 minutes, and it should scale down with how small the new version actually is.
- Keep it a real-world, screen-free action whenever possible.
- Do not mention that this is a "smaller" or "easier" version inside the title/description — just make it genuinely small.

Return ONLY valid JSON, no markdown fences, no extra text, in exactly this shape:
{
  "title": "...",
  "description": "...",
  "duration": number
}
`;

function fallbackSmallerAction(title) {
  return {
    title: `Just start: ${title}`,
    description: "Do the tiniest possible piece of this. Even 60 seconds counts.",
    duration: 2,
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const { title, description, category } = request.body;

  if (!title?.trim()) {
    return response.status(400).json({
      error: "Missing the action to shrink.",
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: MAKE_SMALLER_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Category: ${category ?? "NEXT MOVE"}\nOriginal action: "${title}" — ${description ?? ""}\nMake this smaller.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    const smaller = JSON.parse(content.replace(/```json|```/g, "").trim());

    response.status(200).json(smaller);
  } catch (error) {
    console.error("Groq error:", error.message);

    if (error.status === 429) {
      return response.status(200).json(fallbackSmallerAction(title));
    }

    response.status(500).json({
      error: "GO HUMAN could not shrink that right now.",
    });
  }
}
