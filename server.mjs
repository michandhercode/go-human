import "dotenv/config";
import cors from "cors";
import express from "express";
import Groq from "groq-sdk";

const app = express();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(cors());
app.use(express.json());

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

  if (text.includes("tired") || text.includes("stress") || text.includes("burnout")) {
    return {
      category: "RECHARGE",
      reflection: "It sounds like you need a small pause, not more pressure.",
      action: "Step away from the screen, drink water, and take five slow breaths.",
    };
  }

  return {
    category: "NEXT MOVE",
    reflection: "That sounds heavy. You do not need to solve everything at once.",
    action: "Stand up, take five slow breaths, and choose one kind thing to do for yourself.",
  };
}

app.post("/api/next-move", async (request, response) => {
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
Give exactly one low-pressure action that moves the person away from their screen.

Return only valid JSON, with no markdown:
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
    const cleanContent = content.replace(/```json|```/g, "").trim();
    const nextMove = JSON.parse(cleanContent);

    response.json(nextMove);
  } catch (error) {
    console.error("Groq error:", error.message);

    if (error.status === 429) {
      return response.json(fallbackNextMove(message));
    }

    response.status(500).json({
      error: "GO HUMAN could not think of a next move right now. Please try again.",
    });
  }
});

app.listen(3001, () => {
  console.log("GO HUMAN Groq server is running at http://localhost:3001");
});