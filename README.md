# GO HUMAN

GO HUMAN is a small web app I built to help you figure out what to do next when you're feeling stuck, burnt out, or just endlessly scrolling.

The whole point is simple: instead of designing another app that keeps you glued to your screen, this one tries to get you to put your phone down and do something in the real world.

## What it actually does

*   **AI Next Move:** Just type in how you're feeling or what's going on, and it gives you one simple thing to do next.
*   **Focus:** Helps you actually start studying or working when your brain refuses to cooperate.
*   **Connect:** Quick ideas to reach out to people so you don't isolate yourself.
*   **Recharge:** Suggests a quick screen-free break to reset.
*   **Focus Timer:** A basic 10-minute timer to get the ball rolling.
*   **Your Moments:** Keeps a log of the stuff you actually finished.
*   **XP and Levels:** Gamifies it a bit—you get XP for doing things offline.

## Why I made this

Honestly, I noticed that whenever I'm stressed about school or procrastinating on an assignment, I just default to scrolling for hours. 

I wanted to build something where the AI doesn't try to keep you hooked on the app. It just gives you a little nudge, and the goal is for you to actually go do the thing offline.

## How it works

You literally just type what's happening.

The app sends your message to my backend, which hits the Groq API to generate a quick response. It spits back:

1. A category
2. A quick thought or reflection
3. One actionable step

For example: If you type *"I can't focus on my work,"* it might just tell you to put your phone in another room and focus on a single task for 10 minutes.

## Built With

*   React
*   Vite
*   JavaScript
*   Node.js
*   Groq API
*   CSS
*   LocalStorage

## Running the project

First, install the dependencies:

```bash
npm install
```

Create a `.env` file in the project folder and add your Groq API key:

```text
GROQ_API_KEY=your_api_key_here
```

Then start the backend:

```bash
node server.mjs
```

In another terminal, start the frontend:

```bash
npm run dev
```

Then just open the local URL Vite gives you.

## API Key Note

The API key is stored in the `.env` file so it's hidden from the frontend code. I added `.env` to the `.gitignore` so you don't accidentally leak your key to GitHub.

## Project Status

This is a hackathon project I made myself, so it's definitely still a work in progress. Expect some bugs and changes while I keep messing with the code.