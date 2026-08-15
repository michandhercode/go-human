import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [nextMove, setNextMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");

  const [secondsLeft, setSecondsLeft] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [moments, setMoments] = useState(() => {
    const savedMoments = localStorage.getItem("go-human-moments");
    return savedMoments ? JSON.parse(savedMoments) : [];
  });

  const [xp, setXp] = useState(() => {
    const savedXp = localStorage.getItem("go-human-xp");
    return savedXp ? Number(savedXp) : 0;
  });

  useEffect(() => {
    localStorage.setItem("go-human-moments", JSON.stringify(moments));
  }, [moments]);

  useEffect(() => {
    localStorage.setItem("go-human-xp", xp);
  }, [xp]);

  useEffect(() => {
    if (!isTimerRunning || secondsLeft === 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((currentSeconds) => {
        if (currentSeconds <= 1) {
          setIsTimerRunning(false);
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  function choosePrompt(prompt) {
    setMessage(prompt);
    setNextMove(null);
    setError("");
  }

  async function createNextMove() {
    if (!message.trim()) {
      setError("Tell GO HUMAN what is on your mind first. 💛");
      return;
    }

    setIsThinking(true);
    setError("");
    setNextMove(null);

    try {
      const apiUrl = import.meta.env.DEV
        ? "http://localhost:3001/api/next-move"
        : "/api/next-move";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setNextMove(data);
    } catch (err) {
      setError(err.message || "Could not reach GO HUMAN. Please try again.");
    } finally {
      setIsThinking(false);
    }
  }

  function completeMove() {
    setMoments((currentMoments) => [nextMove, ...currentMoments]);
    setXp((currentXp) => currentXp + 10);
    setNextMove(null);
    setMessage("");
  }

  function resetTimer() {
    setIsTimerRunning(false);
    setSecondsLeft(600);
  }

  return (
    <main className="app">
      <section className="progress-card">
        <div>
          <p className="eyebrow">YOUR GROWTH</p>
          <strong>Level {Math.floor(xp / 50) + 1}</strong>
        </div>
        <span>{xp} XP</span>
      </section>

      <section className="hero">
        <p className="eyebrow">GO HUMAN</p>
        <p className="tagline">
          An AI that helps you live outside the screen.
        </p>
        <h1>What’s going on?</h1>
        <p className="subtitle">
          Tell GO HUMAN what’s happening. It will help you choose your next
          small move.
        </p>

        <textarea
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setNextMove(null);
            setError("");
          }}
          placeholder="Tell me what’s up..."
        />

        <button type="button" onClick={createNextMove} disabled={isThinking}>
          {isThinking ? "GO HUMAN is thinking..." : "Find my next move"}
        </button>

        {error && <p className="error-message">{error}</p>}
      </section>

      <section className="quick-actions">
        <button
          type="button"
          onClick={() => choosePrompt("I need help focusing on my work.")}
        >
          🎯 Focus
        </button>

        <button
          type="button"
          onClick={() =>
            choosePrompt("I feel alone and want to connect with someone.")
          }
        >
          🤝 Connect
        </button>

        <button
          type="button"
          onClick={() => choosePrompt("I feel tired and need to recharge.")}
        >
          🌿 Recharge
        </button>
      </section>

      <section className="focus-timer">
        <p className="eyebrow">FOCUS TIMER</p>
        <p className="timer-time">
          {minutes}:{seconds}
        </p>

        <div className="timer-buttons">
          <button
            type="button"
            onClick={() => setIsTimerRunning(!isTimerRunning)}
          >
            {isTimerRunning ? "Pause" : "Start 10 minutes"}
          </button>

          <button type="button" className="reset-button" onClick={resetTimer}>
            Reset
          </button>
        </div>
      </section>

      {nextMove && (
        <section className="next-move">
          <p className="eyebrow">YOUR NEXT MOVE · {nextMove.category}</p>
          <p className="reflection">{nextMove.reflection}</p>
          <p>{nextMove.action}</p>

          <button type="button" onClick={completeMove}>
            I did it ✨
          </button>
        </section>
      )}

      <section className="moments">
        <div className="moments-heading">
          <p className="eyebrow">YOUR MOMENTS</p>
          <span>{moments.length} completed</span>
        </div>

        {moments.length === 0 ? (
          <div className="empty-state">
            ✨ Complete a next move and it will appear here.
          </div>
        ) : (
          <div className="moments-list">
            {moments.map((moment, index) => (
              <article className="moment-card" key={index}>
                <span>✨</span>
                <p>{moment.action}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;