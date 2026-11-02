import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Connector — Evölingo", description: "A simple way to move files between your devices." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
