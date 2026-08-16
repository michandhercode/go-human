# GO HUMAN

### What if an AI's goal wasn't to keep you on your phone?

GO HUMAN is a small web app I built because I noticed something pretty stupid about my own habits:

Whenever I'm stressed about school, don't know where to start, or just feel tired, I end up scrolling.

And the more I scroll, the harder it gets to actually do anything.

So I wanted to try something different.

Instead of making an AI that gives you more content to consume, **GO HUMAN gives you one small thing to do and then gets out of your way.**

---

## So... what does GO HUMAN actually do?

You tell it what's going on.

Something as simple as:

> "I have a lot of schoolwork and I don't know where to start."

GO HUMAN doesn't give you a 20-step productivity system.

It gives you **one small next move**.

Maybe it's:

> Put your phone somewhere you can't reach it and work on just one task for 10 minutes.

That's basically the whole idea.

**Don't fix your entire life. Just do the next thing.**

---

## The Main Features

### AI Next Move

Describe what's happening and get a small, realistic action based on your situation.

You can also ask for another move if the first suggestion doesn't feel right.

### Focus, Connect & Recharge

The suggestions aren't only about studying.

GO HUMAN can give you ideas for:

- **Focus** — when you can't start your work
- **Connect** — when you've been isolating yourself
- **Recharge** — when you probably just need to step away from the screen

The goal is to make the suggestions feel like something a friend might actually tell you to do.

### Focus Timer

A simple timer for actually starting the thing instead of spending another 30 minutes planning to start it.

### Your Moments

After doing something in the real world, you can save it as a moment.

It can be something small.

Studied for an hour.

Went outside.

Talked to someone.

Finished something you were avoiding.

The point is that the app starts becoming a record of **things you actually did**, instead of things you planned to do.

### Journal Flipbook

Your saved moments can be viewed through a simple journal-style flipbook.

I wanted this to feel more like looking through an old notebook than scrolling through another social media feed.

### Life Stats

GO HUMAN also keeps track of some of the patterns in your moments.

Things like:

- Things you've tried
- People you've connected with
- Things you've done outside
- Memories you've captured
- Your most common adventure categories

It's a small way of seeing that you've actually been doing things.

### XP & Rewards

Completing quests gives you XP.

As you progress, you can unlock rewards and customize parts of your experience.

It's a little bit of gamification, but with one important difference:

**The reward isn't staying in the app.**

The reward is for actually doing something outside of it.

---

## Why I Made This

I'm a college student, and honestly, I built this around a problem I already had.

There are days when I know exactly what I should be doing.

I have an assignment.

I have something to study.

I probably should sleep.

But somehow I end up opening TikTok, YouTube, or Instagram "for a few minutes."

Then an hour disappears.

I realized that most apps are really good at giving me another reason to stay on my phone.

So I wondered:

**What if I made an app that did the opposite?**

What if the AI's job wasn't to keep me engaged?

What if its job was to help me leave?

That's where GO HUMAN came from.

---

## The Idea Behind It

The app is built around a really simple loop:

**Feel stuck → Get one small move → Go do it → Come back → Save the moment → Keep going**

The AI is only one part of that loop.

The actual goal is everything that happens **after** the AI response.

If GO HUMAN tells you to go outside and you actually go outside, that's a win.

If it tells you to text a friend and you actually do it, that's a win.

If it helps you finally start your assignment, that's a win.

And honestly, if you close the app immediately after getting your next move...

**that's probably the best outcome.**

---

## How It Works

The basic flow is pretty simple.

1. You tell GO HUMAN what's going on.
2. The message is sent to my backend.
3. The backend uses the Groq API to generate a contextual response.
4. GO HUMAN turns that into a category, reflection, and actionable next move.
5. You choose whether to do it.
6. If you complete it, you can capture the moment in your journal.
7. Your progress contributes to your stats, XP, and rewards.

I intentionally kept the interaction simple because I didn't want the app itself to become another thing you have to figure out.

---

## Built With

- React
- Vite
- JavaScript
- Node.js
- Express
- Groq API
- CSS
- LocalStorage

---

## Running the Project

First, install the dependencies:

```bash
npm install
```

Create a `.env` file in the project folder:

```text
GROQ_API_KEY=your_api_key_here
```

Start the backend:

```bash
node server.mjs
```

Then, in another terminal:

```bash
npm run dev
```

Open the local URL provided by Vite.

---

## Project Status

This is a hackathon project I built as a college student, so it's definitely not perfect.

There are still things I want to improve, especially around mobile behavior, notifications, and some of the more advanced interactions.

But the core idea is there.

I wanted to see if I could build an AI experience where **success isn't measured by how long someone stays in the app.**

It's measured by what they do after they leave it.

---

## One Last Thing

Most AI apps ask:

> **"What else can I help you with?"**

GO HUMAN asks:

> **"Okay. Now go do it."**