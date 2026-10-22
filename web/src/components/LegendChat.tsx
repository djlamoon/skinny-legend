"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppNav } from "./AppNav";
import { Backdrop } from "./Backdrop";
import { ChromeLogo } from "./ChromeLogo";
import { GelTube } from "./GelTube";
import { RestaurantCard } from "./RestaurantCard";
import type { Budget, ChatLocation, ChatMode, ChatResponse, ChatStatus, RestaurantPick } from "@/lib/chat-types";
import { DEFAULT_STATE, loadState, saveState, type StoredState } from "@/lib/storage";
import { todaySummary } from "@/lib/today";
import { EMPTY_TOTALS, MICRO_META, type LoggedMeal, type Micros } from "@/lib/types";

const CHAT_KEY = "skinny-legend:web:chat:v1";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  picks?: RestaurantPick[];
  mode?: ChatMode;
  warning?: string;
  error?: boolean;
}

const QUICK = [
  "What can I eat today at a restaurant near me?",
  "High-protein lunch nearby 💪",
  "Sushi that fits my macros 🍣",
  "Something sweet under 400 kcal",
];

const THINKING = ["Scoping the block…", "Reading menus with my reading glasses 👓", "Doing macro math in platforms…", "Asking the chrome oracle…"];

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const EMPTY_MICROS = Object.fromEntries(MICRO_META.map((m) => [m.key, { amount: 0, unit: m.unit, dv: 0 }])) as Micros;

function loadChat(): { messages: Msg[]; location: ChatLocation | null } {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return { messages: [], location: null };
    const p = JSON.parse(raw) as { messages?: Msg[]; location?: ChatLocation | null };
    return { messages: Array.isArray(p.messages) ? p.messages.slice(-30) : [], location: p.location ?? null };
  } catch {
    return { messages: [], location: null };
  }
}

function locText(l: ChatLocation | null) {
  if (!l) return null;
  return l.kind === "text" ? l.text : l.label || "Your current location";
}

export function LegendChat() {
  const [state, setState] = useState<StoredState>(DEFAULT_STATE);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [location, setLocation] = useState<ChatLocation | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [editingLoc, setEditingLoc] = useState(false);
  const [locInput, setLocInput] = useState("");
  const [logged, setLogged] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const lastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setState(loadState());
    const c = loadChat();
    setMessages(c.messages);
    setLocation(c.location);
    setHydrated(true);
    fetch("/api/chat")
      .then((r) => r.json())
      .then((j: ChatStatus) => setStatus(j))
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify({ messages: messages.slice(-30), location }));
    } catch {
      /* ignore quota */
    }
  }, [messages, location, hydrated]);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!sending) return;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % THINKING.length), 1500);
    return () => clearInterval(id);
  }, [sending]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const day = todaySummary(state);
  const { totals, goal, left } = day;
  const budget: Budget = {
    goal,
    eaten: { calories: totals.calories, protein: totals.protein, carbs: totals.carbs, fat: totals.fat },
    goals: { protein: day.proteinGoal, carbs: day.carbsGoal, fat: day.fatGoal },
  };
  const proteinLeft = Math.max(0, Math.round(day.proteinGoal - totals.protein));

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocError("No GPS in this browser. Type a city or zip instead.");
      setEditingLoc(true);
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ kind: "coords", lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your current location" });
        setLocating(false);
        setEditingLoc(false);
      },
      (err) => {
        setLocating(false);
        setEditingLoc(true);
        setLocError(err.code === err.PERMISSION_DENIED ? "Location's blocked. No stress, type a city or zip." : "Couldn't find you. Type a city or zip instead.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  const saveManualLoc = () => {
    const t = locInput.trim();
    if (!t) return;
    setLocation({ kind: "text", text: t });
    setEditingLoc(false);
    setLocError(null);
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;
    const userMsg: Msg = { id: uid(), role: "user", content: q };
    const history = [...messages.filter((m) => !m.error), userMsg];
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    requestAnimationFrame(() => lastRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
          location,
          budget,
          localTime: new Date().toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" }),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const r = json as ChatResponse;
      const botMsg: Msg = { id: uid(), role: "assistant", content: r.reply, picks: r.picks, mode: r.mode, warning: r.warning };
      setMessages((m) => [...m, botMsg]);
      requestAnimationFrame(() => document.getElementById(`m-${botMsg.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setMessages((m) => [...m, { id: uid(), role: "assistant", content: `⚠️ ${e instanceof Error ? e.message : String(e)}`, error: true }]);
    } finally {
      setSending(false);
    }
  };

  const logPick = (p: RestaurantPick) => {
    if (!p.order) return;
    const meal: LoggedMeal = {
      id: uid(),
      loggedAt: new Date().toISOString(),
      name: `${p.order.item} @ ${p.name}`,
      totals: { ...EMPTY_TOTALS, calories: p.order.calories, protein: p.order.protein, carbs: p.order.carbs, fat: p.order.fat },
      micros: EMPTY_MICROS,
    };
    setState((s) => ({ ...s, meals: [...s.meals, meal] }));
    setLogged((l) => [...l, `${p.id}:${p.order?.item}`]);
    setToast("Logged (estimate). Legend behavior. 💅");
  };

  const clearChat = () => {
    setMessages([]);
    setLogged([]);
  };

  const demoYelp = status?.yelp === "mock";
  const demoAi = status?.ai === "mock";
  const where = locText(location);

  return (
    <div className="page">
      <Backdrop />

      <header className="hero hero-compact">
        <ChromeLogo />
        <p className="tagline">
          Ask the <span>Legend.</span> Eat iconic.
        </p>
        <AppNav active="chat" />
        {(demoYelp || demoAi) && (
          <span className="badge" title="Missing API keys: some results are example data">
            <i /> Demo mode · {demoYelp && demoAi ? "mock spots & picks" : demoYelp ? "mock spots" : "mock picks"}
          </span>
        )}
      </header>

      <main className="layout chat-layout">
        <div className="col-main">
          <section className="glass chat" aria-label="Legend Chat">
            <div className="chat-head">
              <span className="avatar" aria-hidden>
                👑
              </span>
              <div className="chat-title">
                <h2 className="kicker">Legend Chat</h2>
                <small>
                  <i className="online" /> your sassy food bestie
                </small>
              </div>
              {messages.length > 0 && (
                <button className="chip chip-sm" onClick={clearChat}>
                  Clear
                </button>
              )}
            </div>

            <div className="loc-bar">
              {editingLoc || (!location && locError) ? (
                <form
                  className="loc-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveManualLoc();
                  }}
                >
                  <input
                    className="loc-input"
                    value={locInput}
                    onChange={(e) => setLocInput(e.target.value)}
                    placeholder="City or zip, e.g. Austin, TX or 78701"
                    aria-label="City or zip"
                    autoFocus
                  />
                  <button className="chip chip-sm" type="submit">
                    Set
                  </button>
                  <button className="chip chip-sm" type="button" onClick={useMyLocation} disabled={locating} aria-label="Use my location">
                    📍
                  </button>
                </form>
              ) : (
                <>
                  <span className={`loc-pin ${location ? "on" : ""}`} aria-hidden>
                    📍
                  </span>
                  <span className="loc-text">{where ? <b>{where}</b> : <>Where to, babe?</>}</span>
                  {!location && (
                    <button className="chip chip-sm" onClick={useMyLocation} disabled={locating}>
                      {locating ? "Locating…" : "Use my location"}
                    </button>
                  )}
                  <button
                    className="chip chip-sm"
                    onClick={() => {
                      setLocInput(location?.kind === "text" ? location.text : "");
                      setEditingLoc(true);
                    }}
                  >
                    {location ? "Change" : "City / zip"}
                  </button>
                </>
              )}
            </div>
            {locError && <p className="loc-error">{locError}</p>}

            <div className="budget-strip" aria-label="Left today">
              <span>
                <b>{left >= 0 ? left : 0}</b> kcal left
              </span>
              <span>
                <b>{proteinLeft}g</b> protein to go
              </span>
            </div>

            <div className="chat-log" aria-live="polite">
              <div className="msg bot">
                <span className="mini-avatar" aria-hidden>
                  👑
                </span>
                <div className="bubble bubble-bot">
                  Hey legend 👑 I&apos;m <b>the Legend</b>. Tell me where you are and what you&apos;re craving, and I&apos;ll find spots nearby plus
                  exactly what to order. You&apos;ve got <b>{left >= 0 ? `${left} kcal` : "0 kcal"}</b> left today, so let&apos;s spend it like an icon.
                </div>
              </div>

              {messages.map((m) => (
                <div key={m.id} id={`m-${m.id}`} className={`msg ${m.role === "user" ? "me" : "bot"}`}>
                  {m.role === "assistant" && (
                    <span className="mini-avatar" aria-hidden>
                      👑
                    </span>
                  )}
                  <div className="msg-stack">
                    <div className={`bubble ${m.role === "user" ? "bubble-me" : "bubble-bot"} ${m.error ? "bubble-error" : ""}`}>{m.content}</div>
                    {m.role === "assistant" && (m.mode?.restaurants === "mock" || m.mode?.recs === "mock" || m.warning) && m.picks && m.picks.length > 0 && (
                      <div className="msg-flags">
                        {m.mode?.restaurants === "mock" && <span className="badge small">MOCK restaurants</span>}
                        {m.mode?.recs === "mock" && <span className="badge small">MOCK picks</span>}
                        {m.warning && <span className="flag-note">{m.warning}</span>}
                      </div>
                    )}
                    {m.picks && m.picks.length > 0 && (
                      <>
                        <div className="r-grid">
                          {m.picks.map((p, i) => (
                            <RestaurantCard
                              key={p.id}
                              pick={p}
                              rank={i + 1}
                              recsMock={m.mode?.recs === "mock"}
                              onLog={logPick}
                              logged={logged.includes(`${p.id}:${p.order?.item}`)}
                            />
                          ))}
                        </div>
                        <p className="estimate-note">
                          Calories &amp; macros are the Legend&apos;s <b>estimates</b> for typical portions. Yelp doesn&apos;t share menu nutrition, so
                          ask the restaurant if you need exact numbers.
                          {m.mode?.restaurants === "live" && <> Restaurant info powered by Yelp.</>}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="msg bot">
                  <span className="mini-avatar" aria-hidden>
                    👑
                  </span>
                  <div className="bubble bubble-bot typing">
                    <span className="dots" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="typing-text">{THINKING[lineIdx]}</span>
                  </div>
                </div>
              )}
              <div ref={lastRef} />
            </div>

            {messages.length === 0 && !sending && (
              <div className="quick" aria-label="Try asking">
                {QUICK.map((q) => (
                  <button key={q} className="chip quick-chip" onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                className="composer-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Legend… “tacos near me?”"
                aria-label="Message the Legend"
                maxLength={500}
                enterKeyHint="send"
              />
              <button className="gel gel-send" type="submit" disabled={sending || !input.trim()} aria-label="Send">
                <span className="gel-label">{sending ? "…" : "Send"}</span>
              </button>
            </form>
          </section>
        </div>

        <aside className="col-side">
          <section className="glass today">
            <div className="today-head">
              <h2 className="kicker">Today&apos;s budget</h2>
              <Link href="/" className="chip chip-sm">
                📸 Log a meal
              </Link>
            </div>
            <div className="big-num">
              <span className="chrome-text">{left >= 0 ? left : 0}</span>
              <small>kcal left of {goal}</small>
            </div>
            <GelTube label="Calories" value={totals.calories} goal={goal} unit="" tone="pink" big />
            <div className="tubes">
              <GelTube label="Protein" value={totals.protein} goal={day.proteinGoal} tone="chrome" />
              <GelTube label="Carbs" value={totals.carbs} goal={day.carbsGoal} tone="lilac" />
              <GelTube label="Fat" value={totals.fat} goal={day.fatGoal} tone="cyan" />
            </div>
          </section>

          <section className="glass how">
            <h2 className="kicker">How the Legend picks</h2>
            <ul className="how-list">
              <li>
                <span className="step-ico">📍</span>
                <span>
                  <b>Finds spots</b> near you on Yelp, sorted by best match.
                </span>
              </li>
              <li>
                <span className="step-ico">🧮</span>
                <span>
                  <b>Reads your log</b> so every pick fits what&apos;s left today.
                </span>
              </li>
              <li>
                <span className="step-ico">✂️</span>
                <span>
                  <b>Orders like a pro</b> with hacks that save calories, not joy.
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </main>

      <footer className="footer">Made with chrome, glitter &amp; macros · Skinny Legend ©</footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
