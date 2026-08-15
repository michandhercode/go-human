import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [nextMove, setNextMove] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");

  // The action the user picked from an AI response and is currently doing.
  // Shape: { category, title, description, totalSeconds, secondsLeft, isRunning, isDone }
  const [activeAction, setActiveAction] = useState(null);

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

  // Self-scheduling countdown for the active action's session timer.
  useEffect(() => {
    if (!activeAction || !activeAction.isRunning) return;

    const tick = setTimeout(() => {
      setActiveAction((current) => {
        if (!current) return current;

        if (current.secondsLeft <= 1) {
          return { ...current, secondsLeft: 0, isRunning: false, isDone: true };
        }

        return { ...current, secondsLeft: current.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearTimeout(tick);
  }, [activeAction]);

  // Fire a browser notification exactly once, when the session finishes.
  useEffect(() => {
    if (!activeAction?.isDone) return;

    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    try {
      new Notification("GO HUMAN", {
        body: "Nice. You did the thing. ✨",
      });
    } catch {
      // Notifications aren't available in this environment. That's fine.
    }
  }, [activeAction?.isDone]);

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

  function startAction(option) {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const totalSeconds = Math.max(1, Math.round(option.duration * 60));

    setActiveAction({
      category: nextMove.category,
      title: option.title,
      description: option.description,
      totalSeconds,
      secondsLeft: totalSeconds,
      isRunning: true,
      isDone: false,
    });
  }

  function toggleActionTimer() {
    setActiveAction((current) =>
      current ? { ...current, isRunning: !current.isRunning } : current
    );
  }

  function giveUpAction() {
    setActiveAction(null);
  }

  function finishAction() {
    if (!activeAction) return;

    const moment = {
      category: activeAction.category,
      title: activeAction.title,
      description: activeAction.description,
      duration: Math.round(activeAction.totalSeconds / 60),
    };

    setMoments((currentMoments) => [moment, ...currentMoments]);
    setXp((currentXp) => currentXp + 10);
    setActiveAction(null);
    setNextMove(null);
    setMessage("");
  }

  const sessionMinutes = activeAction
    ? String(Math.floor(activeAction.secondsLeft / 60)).padStart(2, "0")
    : "00";
  const sessionSeconds = activeAction
    ? String(activeAction.secondsLeft % 60).padStart(2, "0")
    : "00";

  return (
    <main className="app">
      <section className="progress-card">
        <div>
          <p className="eyebrow">YOUR GROWTH</p>
          <strong>Level {Math.floor(xp / 50) + 1}</strong>
        </div>
        <span>{xp} XP</span>
      </section>

      {!activeAction && (
        <>
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

          {nextMove && (
            <section className="ai-response">
              <div className="ai-bubble">
                <p className="eyebrow">💬 GO HUMAN · {nextMove.category}</p>
                <p className="ai-message">{nextMove.message}</p>
              </div>

              <div className="options-section">
                <p className="options-heading">WHAT DO YOU WANNA DO?</p>

                <div className="options-grid">
                  {nextMove.options?.map((option, index) => (
                    <article className="option-card" key={index}>
                      <h3>{option.title}</h3>
                      <p>{option.description}</p>
                      <span className="option-duration">{option.duration} MIN</span>

                      <button type="button" onClick={() => startAction(option)}>
                        Start
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {activeAction && !activeAction.isDone && (
        <section className="action-session">
          <p className="eyebrow">🎯 {activeAction.title.toUpperCase()}</p>
          <p className="action-description">{activeAction.description}</p>
          <p className="session-timer">
            {sessionMinutes}:{sessionSeconds}
          </p>

          <div className="session-buttons">
            <button type="button" onClick={toggleActionTimer}>
              {activeAction.isRunning ? "Pause" : "Resume"}
            </button>

            <button type="button" className="giveup-button" onClick={giveUpAction}>
              Give up
            </button>
          </div>

          <p className="session-hint">
            Go do the thing. You can leave the app — we’ll notify you when
            time’s up.
          </p>
        </section>
      )}

      {activeAction && activeAction.isDone && (
        <section className="action-session action-session--done">
          <p className="celebrate">🎉 YOU DID THE THING</p>
          <p className="done-title">{activeAction.title}</p>
          <p className="xp-preview">+10 XP</p>

          <button type="button" onClick={finishAction}>
            Nice, I’m done ✨
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
                <div className="moment-content">
                  <p className="moment-title">{moment.title ?? moment.action}</p>
                  {moment.description && (
                    <p className="moment-description">{moment.description}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
