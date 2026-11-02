"use client";

import { CircleUserRound, Folder, Grid2X2, Menu, MoreHorizontal, Plus, QrCode, Search } from "lucide-react";

export default function Home() {
  return <main className="home-shell"><section className="home-screen" aria-label="File library">
    <header className="home-header"><button className="round-control sidebar-toggle" type="button" aria-label="Open sidebar"><Menu size={19} strokeWidth={1.8} /></button><button className="avatar" type="button" aria-label="Open profile"><span>MD</span></button></header>
    <label className="app-search"><Search size={22} strokeWidth={1.8} aria-hidden="true" /><input type="search" placeholder="Alkalmazások keresése" aria-label="Search applications" /></label>
    <nav className="quick-actions" aria-label="Library actions"><div className="quick-actions-left"><button className="round-action" type="button" aria-label="Library action"><CircleUserRound size={22} strokeWidth={1.7} /></button><button className="round-action" type="button" aria-label="Show connection QR code"><QrCode size={20} strokeWidth={1.7} /></button></div><div className="quick-actions-right"><button className="view-action" type="button" aria-label="Change view"><Grid2X2 size={22} strokeWidth={1.65} /></button><button className="new-action" type="button"><Plus size={20} strokeWidth={1.8} /><span>Új</span></button></div></nav>
    <article className="folder-row"><span className="folder-icon"><Folder size={27} strokeWidth={1.65} /></span><span className="folder-info"><strong>Test</strong><small>1 elem</small></span><button className="more-action" type="button" aria-label="More options for Test"><MoreHorizontal size={23} strokeWidth={2} /></button></article>
  </section></main>;
}
