import { Sparkles } from "./Sparkles";

/** Pink sky, iridescent blobs, chrome grid floor and twinkles. Shared by every page. */
export function Backdrop() {
  return (
    <>
      <div className="bg" aria-hidden>
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="grid-floor" />
      </div>
      <Sparkles />
    </>
  );
}
