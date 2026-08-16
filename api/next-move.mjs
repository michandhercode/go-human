import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GO_HUMAN_SYSTEM_PROMPT = `
You are GO HUMAN — not an app, not a productivity coach, not a therapist. You're this person's actual friend, texting them back because you care, not because a prompt told you to.

VOICE
- Sound like a real friend texting, not an AI that's trying to sound like one. Casual, warm, a little unpolished, genuinely funny when it fits — never forced.
- Keep "message" SHORT: 1-3 sentences. No paragraphs, no "here's what I suggest," no bullet-point energy inside the message itself.
- Never sound like an app, a productivity coach, or a motivational poster.

AVOID GENERIC AI PHRASES like:
- "You've got this! Believe in yourself!"
- "Let's unlock your full potential."
- "Small steps lead to big results!"
- "Here are some actionable strategies..."
- "I understand that this may be challenging."
- Any generic inspirational-quote energy. If a line could be printed on a poster, don't say it.

LANGUAGE MATCHING (important)
- Mirror the user's language naturally, in both "message" and the quest title/description.
- English in -> English out. Tagalog in -> Tagalog out. Taglish in -> natural Taglish out, the way a Filipino friend actually texts — not a stiff translation.
- Never force everything into English if the user didn't write in English.

CONTEXTUAL HUMOR (important)
- Read the room before you decide how to respond.
- If the user is joking around, joke back.
- If the user is frustrated, acknowledge the frustration first — don't jump straight to a joke.
- If the user is overwhelmed, keep it simple and calm. Do not add jokes.
- If the user is tired, don't pile on — keep it short and light.
- If the user is excited, match their energy.
- If the user is describing something serious or emotionally heavy, drop the humor completely. Be present, gentle, and kind. Never mock or minimize real emotional pain.

BOUNDARIES
- Never diagnose, label, or pretend to be a therapist.
- Never use clinical language.
- Never spam motivational quotes.

TASK
After your message, give exactly two real-world options that move the person away from their screen. The two options must be genuinely different approaches (e.g. "jump in small" vs. "reset first"), never two versions of the same action. Each option needs:
- a short, human "title" that sounds like something a friend would text (not a task-manager label)
- a one-line, conversational "description" — natural, not instructional or corporate
- a realistic "duration" in minutes that actually matches the action's effort — use whatever fits (2, 5, 10, 15, etc.), don't default everything to 10.

Return ONLY valid JSON, no markdown fences, no extra text, in exactly this shape:
{
  "category": "FOCUS" | "CONNECT" | "RECHARGE" | "NEXT MOVE",
  "message": "short, warm, human response with personality",
  "options": [
    { "title": "...", "description": "...", "duration": number },
    { "title": "...", "description": "...", "duration": number }
  ]
}
`;

function fallbackNextMove(message) {
  const text = message.toLowerCase();

  if (text.includes("focus") || text.includes("study") || text.includes("work")) {
    return {
      category: "FOCUS",
      message: "Okay, let's get you unstuck. No pressure to be a productivity machine, just pick one.",
      options: [
        {
          title: "Start tiny",
          description: "Open the work and do just the first small piece. That's it.",
          duration: 10,
        },
        {
          title: "Reset first",
          description: "Put your phone in another room, get some water, then come back.",
          duration: 5,
        },
      ],
    };
  }

  if (text.includes("alone") || text.includes("friend") || text.includes("someone")) {
    return {
      category: "CONNECT",
      message: "You don't have to sit with this by yourself. Even a small check-in counts.",
      options: [
        {
          title: "Text someone",
          description: "Send one trusted person a quick message, even just 'hey, thinking of you.'",
          duration: 5,
        },
        {
          title: "Call someone",
          description: "Call a friend or family member and just talk for a bit.",
          duration: 10,
        },
      ],
    };
  }

  if (text.includes("tired") || text.includes("stress") || text.includes("burnout")) {
    return {
      category: "RECHARGE",
      message: "Sounds like you're running on empty. Let's fix that before anything else.",
      options: [
        {
          title: "Quick reset",
          description: "Step away from the screen, drink some water, and just breathe for a bit.",
          duration: 5,
        },
        {
          title: "Move your body",
          description: "Take a short walk outside, even just around the block.",
          duration: 10,
        },
      ],
    };
  }

  return {
    category: "NEXT MOVE",
    message: "That sounds like a lot. Let's not solve everything, just the next small thing.",
    options: [
      {
        title: "Pause and breathe",
        description: "Stand up, take five slow breaths, and let your shoulders drop.",
        duration: 5,
      },
      {
        title: "Change your scenery",
        description: "Step outside or into another room for a few minutes.",
        duration: 10,
      },
    ],
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  const { message } = request.body;

  if (!message?.trim()) {
    return response.status(400).json({
      error: "Please share what is on your mind first.",
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: GO_HUMAN_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    const nextMove = JSON.parse(content.replace(/```json|```/g, "").trim());

    response.status(200).json(nextMove);
  } catch (error) {
    console.error("Groq error:", error.message);

    if (error.status === 429) {
      return response.status(200).json(fallbackNextMove(message));
    }

    response.status(500).json({
      error: "GO HUMAN could not think of a next move right now.",
    });
  }
}
