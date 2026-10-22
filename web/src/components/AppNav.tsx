import Link from "next/link";

/** Chrome pill tab bar between Snap and Legend Chat. */
export function AppNav({ active }: { active: "snap" | "chat" }) {
  return (
    <nav className="tabs" aria-label="Sections">
      <Link href="/" className={`tab ${active === "snap" ? "on" : ""}`} aria-current={active === "snap" ? "page" : undefined}>
        <span className="tab-ico">📸</span> Snap
      </Link>
      <Link href="/chat" className={`tab ${active === "chat" ? "on" : ""}`} aria-current={active === "chat" ? "page" : undefined}>
        <span className="tab-ico">💬</span> Legend Chat
      </Link>
    </nav>
  );
}
