// src/pages/AI/AssistantPage.tsx
import { FormEvent, useState } from "react";
import axiosClient from "../../api/axiosClient";
import DashboardLayout from "../../Layout/DashboardLayout";
import "../../styles/ai.css";

export default function AssistantPage() {
  const household_id = localStorage.getItem("household_id");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askAI = async (e: FormEvent) => {
    e.preventDefault();
    if (!household_id || !question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const res = await axiosClient.post("/ai/assistant", {
        household_id: Number(household_id),
        question: question.trim(),
      });

      setAnswer(res.data.payload?.answer ?? "No answer received.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while contacting HousePlan AI.");
    } finally {
      setLoading(false);
    }
  };

  const setQuickPrompt = (text: string) => {
    setQuestion(text);
  };

  return (
    <DashboardLayout>
      <div className="ai-page">
        <header className="ai-header">
          <div>
            <h1>HousePlan AI</h1>
            <p>
              Ask smart questions about your pantry, shopping lists, and
              expenses. Get cooking ideas and simple budget tips.
            </p>
          </div>
        </header>

        {!household_id ? (
          <p>Please select a household first.</p>
        ) : (
          <section className="ai-main">
            <form className="ai-form" onSubmit={askAI}>
              <label className="ai-label">Your question</label>
              <textarea
                className="ai-textarea"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: What meals can I cook this week using ingredients that expire soon, and what should I avoid buying to save money?"
                rows={4}
              />

              <div className="ai-form-footer">
                <div className="ai-hints">
                  <span>Quick prompts:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickPrompt(
                        "Look at my pantry and suggest 3 dinner ideas for the next three days, using items that expire soon."
                      )
                    }
                  >
                    Dinner ideas
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickPrompt(
                        "Give me a short summary of how much I spent this month per category and one suggestion to improve my budget."
                      )
                    }
                  >
                    Budget summary
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setQuickPrompt(
                        "Which items should I use first to avoid food waste, and what recipes could I make with them?"
                      )
                    }
                  >
                    Reduce waste
                  </button>
                </div>

                <button
                  className="btn-primary ai-submit-btn"
                  disabled={loading || !question.trim()}
                >
                  {loading ? "Thinking..." : "Ask AI"}
                </button>
              </div>
            </form>

            <div className="ai-answer-card">
              <h2>AI answer</h2>

              {loading && <p className="ai-status">Generating answer…</p>}
              {error && <p className="ai-error">{error}</p>}

              {!loading && !error && !answer && (
                <p className="ai-placeholder">
                  Your answer will appear here. Try one of the quick prompts or
                  ask your own question.
                </p>
              )}

              {!loading && !error && answer && (
                <div className="ai-answer-text">
                  {answer.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
