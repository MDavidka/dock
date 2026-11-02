"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

type Session = { host: string; join: string };
type Connection = { connected: boolean };

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState("");
  const [connected, setConnected] = useState(false);

  const createSession = useCallback(async () => {
    const response = await fetch("/api/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }), cache: "no-store" });
    if (!response.ok) throw new Error("Unable to create connection.");
    const next = await response.json() as Session;
    setSession(next);
    const link = new URL(window.location.href);
    link.search = "";
    link.searchParams.set("join", next.join);
    setCode(await QRCode.toDataURL(link.toString(), { width: 800, margin: 0, color: { dark: "#111111", light: "#ffffff" }, errorCorrectionLevel: "M" }));
  }, []);

  useEffect(() => { void createSession().catch(() => setSession(null)); }, [createSession]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    const check = async () => {
      try {
        const response = await fetch("/api/link", { headers: { Authorization: `Bearer ${session.host}` }, cache: "no-store" });
        if (response.ok && active) setConnected((await response.json() as Connection).connected);
      } catch { /* Keep the quiet waiting state while a transient request fails. */ }
    };
    void check();
    const interval = window.setInterval(() => { if (!document.hidden) void check(); }, 2500);
    return () => { active = false; window.clearInterval(interval); };
  }, [session]);

  return <main className="receiving-page"><section className="receiving" aria-live="polite">
    <header><h1>Ready to receive</h1><p>Scan this QR code on another device to<br className="desktop-break" /> send files.</p></header>
    <div className="qr-container" aria-label="QR code for this receiving session">{code ? <img src={code} alt="Scan to connect and send files" /> : <span className="qr-placeholder" aria-label="Preparing QR code" />}</div>
    <div className="connection-status"><span className={connected ? "status-dot is-connected" : "status-spinner"} aria-hidden="true" /><span>{connected ? "Device connected" : "Waiting for connection"}</span></div>
    <p className="supporting-copy">Keep this screen open to receive files.</p>
  </section></main>;
}
