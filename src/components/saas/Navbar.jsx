"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaFlask, FaTimes } from "react-icons/fa";
import { SiVercel } from "react-icons/si";
import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Generation", href: "/" },
    { name: "GPT Image", href: "/images" },
  ];

  return (
    <nav className="h-20 border-b border-glass-border bg-glass-bg backdrop-blur-3xl sticky top-0 z-[100] px-4 md:px-12 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group shrink-0">
        <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
          <FaFlask className="text-white text-lg" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter leading-none italic uppercase text-foreground drop-shadow-sm">
            MEDIA API LAB
          </span>
          <span className="text-[10px] font-black tracking-[0.3em] text-primary-500/80 uppercase">
            BYOK Testbench
          </span>
        </div>
      </Link>

      <div className="hidden lg:flex items-center gap-1 bg-glass-hover p-1 rounded-lg border border-glass-border absolute left-1/2 -translate-x-1/2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all rounded-md ${
                isActive
                  ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                  : "text-muted hover:text-foreground hover:bg-glass-hover"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <a
          href="https://vercel.com/new/clone"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-slate-900/10"
        >
          <SiVercel className="text-xs" />
          Deploy
        </a>

        <button
          className="lg:hidden ml-2 p-2 text-muted hover:text-foreground transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? (
            <FaTimes className="text-xl" />
          ) : (
            <FaBars className="text-xl" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-0 right-0 bg-[var(--solid-bg)]/90 backdrop-blur-2xl border-b border-glass-border shadow-2xl flex flex-col lg:hidden z-50 p-4 gap-2"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-4 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                    isActive
                      ? "bg-primary-500 text-white shadow-lg"
                      : "text-muted hover:bg-glass-bg"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
