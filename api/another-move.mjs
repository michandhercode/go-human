import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const ANOTHER_MOVE_SYSTEM_PROMPT = `
You are GO HUMAN — the same actual friend from before, not a productivity app. The user already got a couple of next-move suggestions for their situation, and now they want ONE more idea — a different angle on the SAME thing, not a random new suggestion.

VOICE
- Sound like a real friend texting, not an AI that's trying to sound like one. Casual, warm, a little unpolished, genuinely playful when it fits — never forced.
- Never sound like an app, a productivity coach, or a motivational poster.

AVOID GENERIC AI PHRASES like:
- "You've got this! Believe in yourself!"
- "Let's unlock your full potential."
- "Small steps lead to big results!"
- "Here are some actionable strategies..."
- "I understand that this may be challenging."
- Any generic inspirational-quote energy. If a line could be printed on a poster, don't say it.

LANGUAGE MATCHING (important)
- Mirror the user's language naturally, based on the original message. English in -> English out. Tagalog in -> Tagalog out. Taglish in -> natural Taglish out, the way a Filipino friend actually texts.
- Never force everything into English if the user didn't write in English.

TASK
You will be given the user's original message and the options already shown to them. Come up with exactly ONE more option that:
1. Stays inside the SAME concrete situation as the original message — do not drift to a different topic.
2. Is a genuinely different angle or type of action than every existing option — not a rewrite, rephrase, reorder, or slightly-tweaked duplicate of one of them.
3. Is a real, doable next step a person could actually take right now.

"REAL-WORLD" DOES NOT MEAN "GO OUTSIDE"
A real-world action can be: opening the thing, doing the smallest piece of it, naming what's blocking them, drafting a message without sending it, checking a detail or deadline, asking someone a question, making a decision, talking to someone, preparing something, or confronting/exploring the actual issue. Pick whatever genuinely fits the situation — do not force it into an offline-wellness shape.

BANNED AS DEFAULTS
Never default to "take a walk," "drink some water," "take a breath," "stretch," "take a break," "grab a coffee/coffee break," or close variants, UNLESS the user's specific situation genuinely calls for that exact thing. Never use one merely because it's easy or safe to suggest.

The new option needs:
- a short, human "title" that sounds like something a friend would text (not a task-manager label)
- a one-line, conversational "description" — natural, not instructional or corporate, that reads as a direct, logical next step for THIS situation
- a realistic "duration" in minutes that matches the action's effort
- a short "why" (one honest sentence) explaining, like a friend would if you asked "wait why though" — grounded in THIS specific situation, never generic encouragement

Return ONLY valid JSON, no markdown fences, no extra text, in exactly this shape:
{
  "title": "...",
  "description": "...",
  "duration": number,
  "why": "..."
}
`;

function fallbackAnotherMove(message) {
  const text = message.toLowerCase();

  if (text.includes("focus") || text.includes("study") || text.includes("work") || text.includes("assignment")) {
    return {
      title: "Figure out what's first",
      description: "Check the deadline and figure out exactly what needs to be done first.",
      duration: 5,
      why: "Knowing the actual next piece makes it a lot harder to keep avoiding the whole thing.",
    };
  }

  if (text.includes("alone") || text.includes("friend") || text.includes("someone")) {
    return {
      title: "Write it out first",
      description: "Jot down what you'd actually want to say before reaching out to anyone.",
      duration: 5,
      why: "Knowing what you want to say first makes the actual reaching-out feel a lot less intimidating.",
    };
  }

  if (text.includes("tired") || text.includes("stress") || text.includes("burnout")) {
    return {
      title: "Name what's draining you",
      description: "Write down the one thing that's taking the most out of you right now.",
      duration: 5,
      why: "It's hard to recharge when you don't know what's actually running the battery down.",
    };
  }

  return {
    title: "Break off one piece",
    description: "Pick the smallest part of this and just handle that one piece.",
    duration: 5,
    why: "The whole thing feels big, but one small piece is a lot more manageable to actually start.",
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const { message, existingOptions } = request.body;

  if (!message?.trim()) {
    return response.status(400).json({
      error: "Please share what is on your mind first.",
    });
  }

  const optionsList = Array.isArray(existingOptions) ? existingOptions : [];
  const optionsSummary = optionsList
    .map((option, index) => `${index + 1}. ${option?.title ?? ""} — ${option?.description ?? ""}`)
    .join("\n");

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: ANOTHER_MOVE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Original message: "${message}"\n\nOptions already shown:\n${
            optionsSummary || "(none yet)"
          }\n\nGive me exactly one more option, genuinely different from the ones above.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    const anotherMove = JSON.parse(content.replace(/```json|```/g, "").trim());

    response.status(200).json(anotherMove);
  } catch (error) {
    console.error("Groq error:", error.message);

    if (error.status === 429) {
      return response.status(200).json(fallbackAnotherMove(message));
    }

    response.status(500).json({
      error: "GO HUMAN could not think of another move right now.",
    });
  }
}