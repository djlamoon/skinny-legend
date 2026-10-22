"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChromeLogo } from "./ChromeLogo";
import { AppNav } from "./AppNav";
import { Backdrop } from "./Backdrop";
import { GelTube } from "./GelTube";
import { FoodBreakdown, NutritionCard } from "./NutritionCard";
import { prepareImage, type PreparedImage } from "@/lib/image";
import { DEFAULT_STATE, loadState, saveState, type StoredState } from "@/lib/storage";
import { todaySummary } from "@/lib/today";
import type { AnalysisResult, LoggedMeal } from "@/lib/types";

type Phase = "idle" | "preparing" | "analyzing" | "result" | "error";

const LOADING_LINES = [
  "Reading the plate…",
  "Counting macros with a magnifying glass 🔍",
  "Consulting the chrome oracle…",
  "Judging lovingly, never harshly…",
];

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function vibe(eaten: number, goal: number) {
  if (!eaten) return "Plate's empty, babe. Snap something iconic.";
  const p = eaten / goal;
  if (p < 0.5) return "Warming up. The legend is loading…";
  if (p < 0.9) return "On track and looking snatched. ✨";
  if (p <= 1.05) return "Goal hit. Certified Skinny Legend. 👑";
  return "Over goal — legends have cheat days too. 💅";
}

export function SkinnyLegendApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<StoredState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [lineIdx, setLineIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setState(loadState());
    setHydrated(true);
    fetch("/api/analyze")
      .then((r) => r.json())
      .then((j: { mode: string }) => setDemo(j.mode === "mock"))
      .catch(() => setDemo(null));
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = setInterval(() => setLineIdx((i) => (i + 1) % LOADING_LINES.length), 1600);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const handleFile = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That's not a pic, babe. Images only.");
      setPhase("error");
      return;
    }
    setError(null);
    setResult(null);
    setPhase("preparing");
    try {
      const prepared = await prepareImage(file);
      setImage(prepared);
      setPhase("analyzing");
      const form = new FormData();
      form.append("image", prepared.blob, "meal.jpg");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const r = json as AnalysisResult;
      setResult(r);
      if (r.mode === "mock") setDemo(true);
      setPhase("result");
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }, []);

  const reset = () => {
    setPhase("idle");
    setImage(null);
    setResult(null);
    setError(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
  };

  const logMeal = () => {
    if (!result) return;
    const name = result.foods.map((f) => f.name).join(", ") || "Mystery meal";
    const meal: LoggedMeal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      loggedAt: new Date().toISOString(),
      name,
      thumb: image?.thumb,
      totals: result.totals,
      micros: result.micros,
    };
    setState((s) => ({ ...s, meals: [...s.meals, meal] }));
    setToast("Logged. Legend behavior. 💅");
    reset();
  };

  const deleteMeal = (id: string) => setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
  const setGoal = (goal: number) => setState((s) => ({ ...s, goal: goal > 0 ? goal : s.goal }));

  const { meals: today, totals, goal, left, proteinGoal, carbsGoal, fatGoal } = todaySummary(state);

  return (
    <div className="page">
      <Backdrop />

      <header className="hero">
        <ChromeLogo />
        <p className="tagline">
          Snap it. <span>Track it.</span> Slay it.
        </p>
        <AppNav active="snap" />
        {demo && (
          <span className="badge" title="No API key configured — results are example data">
            <i /> Demo mode · mock results
          </span>
        )}
      </header>

      <main className="layout">
        <div className="col-main">
          <section
            className={`glass snap ${dragging ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            {image ? (
              <div className={`preview chrome-frame ${phase === "analyzing" || phase === "preparing" ? "scanning" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.previewUrl} alt="Your meal" />
                {(phase === "analyzing" || phase === "preparing") && (
                  <div className="scan">
                    <div className="scan-line" />
                    <p className="scan-text">{LOADING_LINES[lineIdx]}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="snap-empty">
                <div className="orb" aria-hidden>
                  <svg viewBox="0 0 64 64">
                    <defs>
                      <linearGradient id="cam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#fff" />
                        <stop offset="0.5" stopColor="#ffd9ef" />
                        <stop offset="1" stopColor="#ff7cc3" />
                      </linearGradient>
                    </defs>
                    <path d="M22 14h20l4 6h6a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6h6z" fill="url(#cam)" stroke="#7a0b47" strokeWidth="3" strokeLinejoin="round" />
                    <circle cx="32" cy="37" r="11" fill="#2a0619" stroke="#fff" strokeWidth="3" />
                    <circle cx="28" cy="33" r="3.5" fill="#fff" opacity="0.85" />
                  </svg>
                </div>
                <p className="snap-hint">
                  Show us the plate. We&apos;ll do the math, <em>you</em> do the slaying.
                </p>
              </div>
            )}

            {error && <p className="error">⚠️ {error}</p>}

            <div className="actions">
              {phase === "result" ? null : (
                <button className="gel gel-xl" onClick={() => cameraRef.current?.click()} disabled={phase === "analyzing" || phase === "preparing"}>
                  <span className="gel-label">
                    <span className="gel-icon">📸</span>
                    {phase === "analyzing" || phase === "preparing" ? "Analyzing…" : image ? "Snap another" : "Snap your plate"}
                  </span>
                </button>
              )}
              <div className="sub-actions">
                <button className="chip" onClick={() => libraryRef.current?.click()} disabled={phase === "analyzing"}>
                  Upload a pic
                </button>
                <span className="drop-hint">or drag &amp; drop it here</span>
              </div>
            </div>
            {!image && (
              <ul className="steps">
                <li>
                  <span className="step-ico">📸</span>
                  <b>Snap</b>
                  <small>Your plate, any angle</small>
                </li>
                <li>
                  <span className="step-ico">✨</span>
                  <b>AI reads it</b>
                  <small>Calories, macros &amp; vitamins</small>
                </li>
                <li>
                  <span className="step-ico">💅</span>
                  <b>Log &amp; slay</b>
                  <small>Edit, save, repeat</small>
                </li>
              </ul>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
            <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
          </section>

          {result && phase === "result" && (
            <div ref={resultRef} className="result">
              <div className="verdict glass">
                <span className="verdict-mark" aria-hidden="true" />
                <p>{result.verdict}</p>
                {result.mode === "mock" && <span className="badge small">MOCK example data</span>}
              </div>
              <NutritionCard result={result} onChange={setResult} />
              <FoodBreakdown result={result} onChange={setResult} />
              <div className="result-actions">
                <button className="gel gel-xl" onClick={logMeal}>
                  <span className="gel-label">
                    <span className="gel-icon">💅</span> Log it
                  </span>
                </button>
                <button className="chip" onClick={reset}>
                  Retake
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="col-side">
          <section className="glass today">
            <div className="today-head">
              <h2 className="kicker">Today</h2>
              <label className="goal">
                Goal
                <input
                  className="num"
                  type="number"
                  inputMode="numeric"
                  min={500}
                  step={50}
                  value={goal}
                  aria-label="Daily calorie goal"
                  onChange={(e) => setGoal(parseInt(e.target.value, 10))}
                />
                kcal
              </label>
            </div>
            <div className="big-num">
              <span className="chrome-text">{Math.round(totals.calories)}</span>
              <small>/ {goal} kcal</small>
            </div>
            <GelTube label="Calories" value={totals.calories} goal={goal} unit="" tone="pink" big />
            <p className="left">
              {left >= 0 ? (
                <>
                  <b>{left}</b> kcal left
                </>
              ) : (
                <>
                  <b>{-left}</b> kcal over
                </>
              )}{" "}
              · <span className="vibe">{vibe(totals.calories, goal)}</span>
            </p>
            <div className="tubes">
              <GelTube label="Protein" value={totals.protein} goal={proteinGoal} tone="chrome" />
              <GelTube label="Carbs" value={totals.carbs} goal={carbsGoal} tone="lilac" />
              <GelTube label="Fat" value={totals.fat} goal={fatGoal} tone="cyan" />
            </div>
          </section>

          <section className="glass meals">
            <h2 className="kicker">Today&apos;s meals</h2>
            {!hydrated ? null : today.length === 0 ? (
              <p className="empty">Nothing logged yet. The camera is right there. 👀</p>
            ) : (
              <ul>
                {today.map((m) => (
                  <li key={m.id} className="meal">
                    {m.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="thumb" src={m.thumb} alt="" />
                    ) : (
                      <span className="thumb thumb-empty">🍽️</span>
                    )}
                    <div className="meal-info">
                      <b>{m.name}</b>
                      <small>
                        {timeLabel(m.loggedAt)} · P {Math.round(m.totals.protein)}g · C {Math.round(m.totals.carbs)}g · F {Math.round(m.totals.fat)}g
                      </small>
                    </div>
                    <span className="meal-kcal">{Math.round(m.totals.calories)}</span>
                    <button className="x" aria-label={`Delete ${m.name}`} onClick={() => deleteMeal(m.id)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </main>

      <footer className="footer">Made with chrome, glitter &amp; macros · Skinny Legend ©</footer>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
