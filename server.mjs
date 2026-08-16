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
Do NOT think "user message -> generic healthy offline activity." Think "user message -> understand the specific situation -> identify what the person is trying to do or avoid -> identify what's blocking them -> generate two next moves that logically follow from THAT situation." The user's actual situation always outranks any instinct to be "screen-free" or "healthy" for its own sake.

Before writing anything, work out (silently, don't show this):
1. What is the user's concrete situation, in their own terms?
2. What do they appear to want, want to avoid, need to decide, or need to accomplish?
3. What's the obstacle, tension, or uncertainty here, if any?
4. Given THAT, what are two genuinely different, plausible next moves a person could actually take?

"REAL-WORLD" DOES NOT MEAN "GO OUTSIDE"
A real-world action can be: opening the assignment, getting ready for class, writing a message but not sending it, checking a deadline, asking someone a question, putting something away, making a decision, talking to someone, starting one small part of the thing, preparing something, or confronting/exploring the actual issue. Pick whatever actually fits the situation — do not force every option into an offline-wellness shape.

DOMAIN RULES
- If the user is facing a decision, one option can help them clarify the decision, the other can help them cautiously act on it.
- If the user is procrastinating, the next move should usually engage the actual task or the reason they're avoiding it (e.g. open it, do the smallest piece, name what's blocking them) — not redirect them elsewhere.
- If the user wants to contact someone, the next move should relate to that communication (e.g. draft it without sending, decide what they actually want from it).
- If the user wants to avoid something (class, a task, a conversation), the next move should relate to that thing itself, not randomly redirect them to something unrelated.
- If they're talking about school, work, relationships, money, errands, or a hobby, keep both options grounded in that same domain.
- If the message is genuinely too ambiguous to ground real options in, ask a short natural clarifying question in "message" instead of inventing a random task — "options" can then offer two small, low-stakes ways to respond (e.g. answering the question vs. saying more), still following the rules below.

BANNED AS DEFAULTS
Never use these as a default/filler suggestion: "take a walk," "drink some water," "take a breath," "stretch," "take a break," "grab a coffee/coffee break," or close variants — in either option. They're allowed ONLY when the user's specific situation genuinely calls for that exact thing (e.g. they said they haven't had water all day). Never use one merely because it's easy or safe to suggest.

Example — "I wanna skip class": bad = "take a short walk" / "grab a coffee." Better = "spend 2 minutes figuring out if it's exhaustion, boredom, anxiety, or something else" / "get ready and head toward class, decide once you're actually there."
Example — "I don't wanna study anymore": bad = "take a walk" / "drink some water." Better = "finish just one more problem, then reassess" / "figure out if you're bored, confused, tired, or overwhelmed."
Example — "I keep procrastinating on my assignment": bad = "drink water" / "stretch." Better = "pull up the assignment and write the first sentence" / "pick the easiest part and finish just that."
Example — "I wanna text my ex": bad = "go for a walk" / "grab a coffee." Better = "type what you want to send but don't send it yet" / "figure out what you actually hope happens if you send it."
These are guidance for the KIND of thinking to do, not fixed scripts — derive fresh options from what the user actually says, don't copy them verbatim.

TWO GENUINELY DIFFERENT OPTIONS
The two options must be different approaches to the SAME situation (e.g. "clarify first" vs. "act now"), never two versions of the same action, and never two generic activities. Don't repeat the same type of action across both options — e.g. don't give two "take a break" variants, and don't give two physical-reset activities back to back. Options should read like something a smart, attentive friend would actually say after really listening — not a wellness-app template.

Each option needs:
- a short, human "title" that sounds like something a friend would text (not a task-manager label)
- a one-line, conversational "description" — natural, not instructional or corporate, that reads as a direct, logical next step for THIS situation
- a realistic "duration" in minutes that actually matches the action's effort — use whatever fits (2, 5, 10, 15, etc.), don't default everything to 10.
- a short "why" (one honest sentence) explaining, like a friend would if you asked "wait why though" — grounded in THIS specific situation, never generic encouragement.

Return ONLY valid JSON, no markdown fences, no extra text, in exactly this shape:
{
  "category": "FOCUS" | "CONNECT" | "RECHARGE" | "NEXT MOVE",
  "message": "short, warm, human response with personality",
  "options": [
    { "title": "...", "description": "...", "duration": number, "why": "..." },
    { "title": "...", "description": "...", "duration": number, "why": "..." }
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
          why: "Starting is the actual blocker, not finishing — this gets you moving without asking for the whole thing.",
        },
        {
          title: "Reset first",
          description: "Put your phone in another room, get some water, then come back.",
          duration: 5,
          why: "Sometimes the focus problem is really a distraction problem, so clearing that first makes the next step easier.",
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
          why: "Low-pressure and quick, so it doesn't feel like a big ask when you're already feeling low.",
        },
        {
          title: "Call someone",
          description: "Call a friend or family member and just talk for a bit.",
          duration: 10,
          why: "A real conversation cuts through the isolation faster than sitting with it alone.",
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
          why: "You said you're running on empty, so this is about refilling the tank before anything else.",
        },
        {
          title: "Move your body",
          description: "Take a short walk outside, even just around the block.",
          duration: 10,
          why: "Movement is a fast way to shake off stress when your head's too full to think straight.",
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
        why: "When everything feels like a lot, slowing your body down for a minute makes the next step less overwhelming.",
      },
      {
        title: "Change your scenery",
        description: "Step outside or into another room for a few minutes.",
        duration: 10,
        why: "A change of scenery can loosen up a stuck headspace without needing to solve anything yet.",
      },
    ],
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
          content: GO_HUMAN_SYSTEM_PROMPT,
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

app.post("/api/another-move", async (request, response) => {
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
    const cleanContent = content.replace(/```json|```/g, "").trim();
    const anotherMove = JSON.parse(cleanContent);

    response.json(anotherMove);
  } catch (error) {
    console.error("Groq error:", error.message);

    if (error.status === 429) {
      return response.json(fallbackAnotherMove(message));
    }

    response.status(500).json({
      error: "GO HUMAN could not think of another move right now.",
    });
  }
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

app.post("/api/smaller-action", async (request, response) => {
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
    const cleanContent = content.replace(/```json|```/g, "").trim();
    const smaller = JSON.parse(cleanContent);

    response.json(smaller);
  } catch (error) {
    console.error("Groq error:", error.message);

    if (error.status === 429) {
      return response.json(fallbackSmallerAction(title));
    }

    response.status(500).json({
      error: "GO HUMAN could not shrink that right now.",
    });
  }
});

app.listen(3001, () => {
  console.log("GO HUMAN Groq server is running at http://localhost:3001");
});