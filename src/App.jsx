import { useState, useRef, useEffect } from "react";

const EXAMPLE_CONTENT = `The James Webb Space Telescope (JWST) is a space telescope designed to conduct infrared astronomy. As the largest optical telescope in space, its high resolution and sensitivity allow it to view objects too old, distant, or faint for its predecessor, the Hubble Space Telescope. This has enabled investigations across many fields of astronomy and cosmology, such as observation of the first stars and the formation of the first galaxies, and detailed atmospheric characterization of potentially habitable exoplanets. Webb was launched on 25 December 2021 and reached its destination—the Sun–Earth L2 Lagrange point—in January 2022. The first full-color images were released to the public on July 12, 2022.`;

const EXAMPLE_QUESTIONS = [
  "What is the main purpose of JWST?",
  "How does JWST compare to Hubble?",
  "When was JWST launched?",
];

export default function App() {
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | thinking | done
  const answerRef = useRef(null);
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [answer]);

  const loadExample = () => {
    setContent(EXAMPLE_CONTENT);
    setAnswer("");
    setError("");
  };

  const askQuestion = async () => {
    if (!content.trim()) {
      setError("Please paste some content first.");
      return;
    }
    if (!question.trim()) {
      setError("Please type a question.");
      return;
    }
    if (!apiKey) {
      setError("API key not found. Add VITE_GROQ_API_KEY to your .env file.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setPhase("thinking");

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1024,
            messages: [
              {
                role: "system",
                content: `You are a precise Q&A assistant. The user will give you a passage of content, and you must answer their question based ONLY on that content. Be concise, accurate, and cite relevant parts of the content. If the answer cannot be found in the content, say so clearly.`,
              },
              {
                role: "user",
                content: `CONTENT:\n${content}\n\nQUESTION: ${question}`,
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Groq API error");
      }

      const data = await response.json();
      const aiAnswer =
        data.choices?.[0]?.message?.content || "No answer returned.";
      setAnswer(aiAnswer);
      setPhase("done");
      setHistory((prev) =>
        [
          { question, answer: aiAnswer, time: new Date().toLocaleTimeString() },
          ...prev,
        ].slice(0, 5),
      );
    } catch (e) {
      setError(e.message);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) askQuestion();
  };

  const clearAll = () => {
    setContent("");
    setQuestion("");
    setAnswer("");
    setError("");
    setPhase("idle");
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoDot} />
          <span style={styles.logoText}>ASKDOC</span>
          <span style={styles.logoBadge}>AI</span>
        </div>
        <p style={styles.tagline}>
          Drop any content. Ask anything. Get precise answers.
        </p>
      </header>

      <main style={styles.main}>
        {/* Left Column */}
        <div style={styles.column}>
          {/* Content Input */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={{ ...styles.dot, background: "#7c6af7" }} />
                Content Input
              </div>
              <div style={styles.cardActions}>
                <span style={styles.charCount}>{charCount} chars</span>
                <button style={styles.ghostBtn} onClick={loadExample}>
                  Load Example
                </button>
                {content && (
                  <button
                    style={styles.ghostBtn}
                    onClick={() => {
                      setContent("");
                      setAnswer("");
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <textarea
              style={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your article, paragraph, or any text here (5–10 lines recommended)..."
              rows={10}
              spellCheck={false}
            />
          </section>

          {/* Question Input */}
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={{ ...styles.dot, background: "#f472b6" }} />
                Your Question
              </div>
              <span style={styles.hint}>Ctrl+Enter to ask</span>
            </div>
            <div style={styles.questionRow}>
              <input
                style={styles.input}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What is the main idea? Who is mentioned? When did...?"
                disabled={loading}
              />
              <button
                style={{ ...styles.askBtn, opacity: loading ? 0.6 : 1 }}
                onClick={askQuestion}
                disabled={loading}
              >
                {loading ? (
                  <span style={styles.spinner} />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </div>

            {/* Quick question chips */}
            {!content && (
              <div style={styles.chips}>
                <span style={styles.chipsLabel}>Examples:</span>
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    style={styles.chip}
                    onClick={() => {
                      loadExample();
                      setQuestion(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div style={styles.column}>
          {/* Answer Display */}
          <section
            style={{ ...styles.card, ...styles.answerCard }}
            ref={answerRef}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={{ ...styles.dot, background: "#34d399" }} />
                AI Answer
              </div>
              {phase === "thinking" && (
                <div style={styles.thinkingBadge}>
                  <span style={styles.thinkingDot} />
                  Thinking...
                </div>
              )}
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠</span>
                {error}
              </div>
            )}

            {!answer && !loading && !error && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.3"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <p style={styles.emptyText}>Your answer will appear here</p>
                <p style={styles.emptySubtext}>
                  Paste content → Ask a question → Get a precise answer
                </p>
              </div>
            )}

            {loading && (
              <div style={styles.loadingState}>
                <div style={styles.loadingBars}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        ...styles.loadingBar,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <p style={styles.loadingText}>Analyzing your content...</p>
              </div>
            )}

            {answer && !loading && (
              <div style={styles.answerBody}>
                <div style={styles.answerQuote}>
                  <span style={styles.quoteIcon}>"</span>
                  {question}
                </div>
                <div style={styles.answerText}>{answer}</div>
                <div style={styles.answerFooter}>
                  <button
                    style={styles.ghostBtn}
                    onClick={() => {
                      setAnswer("");
                      setQuestion("");
                      setPhase("idle");
                    }}
                  >
                    Ask another
                  </button>
                  <button style={styles.ghostBtn} onClick={clearAll}>
                    Start over
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* History */}
          {history.length > 0 && (
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <span style={{ ...styles.dot, background: "#f59e0b" }} />
                  Recent Q&A
                </div>
                <button style={styles.ghostBtn} onClick={() => setHistory([])}>
                  Clear
                </button>
              </div>
              <div style={styles.historyList}>
                {history.map((item, i) => (
                  <div
                    key={i}
                    style={styles.historyItem}
                    onClick={() => {
                      setQuestion(item.question);
                      setAnswer(item.answer);
                      setPhase("done");
                    }}
                  >
                    <div style={styles.historyQ}>{item.question}</div>
                    <div style={styles.historyA}>
                      {item.answer.slice(0, 80)}...
                    </div>
                    <div style={styles.historyTime}>{item.time}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer style={styles.footer}>
        Built with React + Groq API (Llama 3.3 70B) 
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bar { 0%,100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        textarea:focus, input:focus { outline: none; border-color: var(--accent) !important; box-shadow: 0 0 0 3px rgba(124,106,247,0.12) !important; }
        textarea::placeholder, input::placeholder { color: var(--text-faint); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        button:hover { opacity: 0.8 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
  },
  header: { padding: "48px 0 32px", textAlign: "center" },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#7c6af7",
    boxShadow: "0 0 12px #7c6af7",
  },
  logoText: {
    fontFamily: "Syne, sans-serif",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#e8e8f0",
  },
  logoBadge: {
    background: "linear-gradient(135deg, #7c6af7, #f472b6)",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#fff",
  },
  tagline: {
    color: "#8888a8",
    fontFamily: "DM Mono, monospace",
    fontSize: 13,
    letterSpacing: "0.05em",
  },
  main: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    flex: 1,
    paddingBottom: 32,
  },
  column: { display: "flex", flexDirection: "column", gap: 20 },
  card: {
    background: "#111118",
    border: "1px solid #2a2a38",
    borderRadius: 12,
    padding: 20,
    transition: "border-color 0.2s",
  },
  answerCard: { flex: 1, minHeight: 300 },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#e8e8f0",
  },
  cardActions: { display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  charCount: {
    fontFamily: "DM Mono, monospace",
    fontSize: 11,
    color: "#44445a",
  },
  ghostBtn: {
    background: "none",
    border: "1px solid #2a2a38",
    borderRadius: 6,
    padding: "4px 10px",
    color: "#8888a8",
    fontSize: 11,
    fontFamily: "Syne, sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
  },
  hint: { fontFamily: "DM Mono, monospace", fontSize: 10, color: "#44445a" },
  textarea: {
    width: "100%",
    background: "#0d0d14",
    border: "1px solid #2a2a38",
    borderRadius: 8,
    padding: 14,
    color: "#e8e8f0",
    fontFamily: "DM Mono, monospace",
    fontSize: 13,
    lineHeight: 1.7,
    resize: "vertical",
    minHeight: 200,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  questionRow: { display: "flex", gap: 10 },
  input: {
    flex: 1,
    background: "#0d0d14",
    border: "1px solid #2a2a38",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#e8e8f0",
    fontFamily: "DM Mono, monospace",
    fontSize: 13,
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  askBtn: {
    background: "linear-gradient(135deg, #7c6af7, #9b8bf9)",
    border: "none",
    borderRadius: 8,
    padding: "12px 18px",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 20px rgba(124,106,247,0.4)",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  chips: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  chipsLabel: {
    fontFamily: "DM Mono, monospace",
    fontSize: 10,
    color: "#44445a",
    marginRight: 4,
  },
  chip: {
    background: "#18181f",
    border: "1px solid #2a2a38",
    borderRadius: 20,
    padding: "4px 12px",
    color: "#8888a8",
    fontSize: 11,
    fontFamily: "DM Mono, monospace",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  errorBox: {
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 8,
    padding: "12px 14px",
    color: "#f87171",
    fontFamily: "DM Mono, monospace",
    fontSize: 12,
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  errorIcon: { fontSize: 14, flexShrink: 0 },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    gap: 12,
  },
  emptyIcon: { marginBottom: 8 },
  emptyText: { color: "#44445a", fontWeight: 600, fontSize: 14 },
  emptySubtext: {
    color: "#2a2a38",
    fontFamily: "DM Mono, monospace",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 1.6,
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    gap: 20,
  },
  loadingBars: { display: "flex", alignItems: "flex-end", gap: 5, height: 40 },
  loadingBar: {
    width: 6,
    height: "100%",
    background: "#7c6af7",
    borderRadius: 3,
    transformOrigin: "bottom",
    animation: "bar 0.9s ease-in-out infinite",
  },
  loadingText: {
    color: "#44445a",
    fontFamily: "DM Mono, monospace",
    fontSize: 12,
    animation: "blink 1.5s ease-in-out infinite",
  },
  answerBody: { display: "flex", flexDirection: "column", gap: 14 },
  answerQuote: {
    background: "#18181f",
    borderLeft: "3px solid #7c6af7",
    borderRadius: "0 6px 6px 0",
    padding: "10px 14px",
    fontFamily: "DM Mono, monospace",
    fontSize: 12,
    color: "#8888a8",
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
  },
  quoteIcon: {
    color: "#7c6af7",
    fontSize: 20,
    lineHeight: 1,
    fontFamily: "Georgia, serif",
    flexShrink: 0,
    marginTop: -2,
  },
  answerText: {
    color: "#e8e8f0",
    fontSize: 14,
    lineHeight: 1.8,
    fontFamily: "DM Mono, monospace",
    whiteSpace: "pre-wrap",
  },
  answerFooter: { display: "flex", gap: 10, marginTop: 8 },
  thinkingBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(124,106,247,0.1)",
    border: "1px solid rgba(124,106,247,0.2)",
    borderRadius: 20,
    padding: "4px 12px",
    color: "#9b8bf9",
    fontSize: 11,
    fontFamily: "DM Mono, monospace",
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#7c6af7",
    animation: "blink 1s ease-in-out infinite",
  },
  historyList: { display: "flex", flexDirection: "column", gap: 8 },
  historyItem: {
    background: "#0d0d14",
    border: "1px solid #1e1e2a",
    borderRadius: 8,
    padding: 12,
    cursor: "pointer",
    transition: "border-color 0.2s",
    position: "relative",
  },
  historyQ: {
    fontWeight: 700,
    fontSize: 12,
    color: "#c8c8e0",
    marginBottom: 4,
  },
  historyA: {
    fontFamily: "DM Mono, monospace",
    fontSize: 11,
    color: "#44445a",
    lineHeight: 1.5,
  },
  historyTime: {
    fontFamily: "DM Mono, monospace",
    fontSize: 10,
    color: "#2a2a38",
    marginTop: 6,
  },
  footer: {
    textAlign: "center",
    padding: "20px 0 32px",
    color: "#2a2a38",
    fontFamily: "DM Mono, monospace",
    fontSize: 11,
    lineHeight: 1.8,
  },
  code: {
    background: "#18181f",
    border: "1px solid #2a2a38",
    borderRadius: 4,
    padding: "1px 6px",
    color: "#7c6af7",
    fontFamily: "DM Mono, monospace",
  },
};
