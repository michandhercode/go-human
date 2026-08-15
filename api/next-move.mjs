import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function fallbackNextMove(message) {
  const text = message.toLowerCase();

  if (text.includes("focus") || text.includes("study") || text.includes("work")) {
    return {
      category: "FOCUS",
      reflection: "Let’s make the next step smaller so it feels easier to start.",
      action: "Put your phone face down and focus on one task for 10 minutes.",
    };
  }

  if (text.includes("alone") || text.includes("friend") || text.includes("someone")) {
    return {
      category: "CONNECT",
      reflection: "You deserve support; you do not have to carry this alone.",
      action: "Message one trusted person and ask if they have five minutes to talk.",
    };
  }

  return {
    category: "NEXT MOVE",
    reflection: "That sounds heavy. You do not need to solve everything at once.",
    action: "Stand up, take five slow breaths, and choose one kind thing to do for yourself.",
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
          content: `
You are GO HUMAN: a warm, grounded guide that helps people take one small action in the real world.

Match the user's language naturally. Taglish is welcome when the user uses Taglish.
Sound kind, human, clear, and never judgmental.
Do not diagnose mental-health conditions or pretend to be a therapist.
Give exactly one low-pressure action away from the screen.

Return only valid JSON:
{
  "category": "FOCUS, CONNECT, RECHARGE, or NEXT MOVE",
  "reflection": "One short supportive sentence.",
  "action": "One clear, small real-world action."
}
          `,
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