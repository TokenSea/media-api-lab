"use client";

import { motion } from "framer-motion";
import { FaKey, FaShieldAlt, FaVideo } from "react-icons/fa";
import Link from "next/link";

export default function PricingPage() {
  const items = [
    {
      icon: FaKey,
      title: "Bring Your Own Key",
      body: "Requests use the API URL and key you enter in the generator.",
    },
    {
      icon: FaShieldAlt,
      title: "No App Account",
      body: "Google login, app credits, and Stripe checkout are removed.",
    },
    {
      icon: FaVideo,
      title: "Direct Usage",
      body: "Generation costs are billed by your Seedance-compatible provider.",
    },
  ];

  return (
    <div className="flex-1 bg-transparent overflow-y-auto custom-scrollbar p-4 md:p-12">
      <header className="max-w-5xl mx-auto mb-10 text-center space-y-4 pt-4 md:pt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-500/10 border border-primary-500/20 text-primary-500 text-[10px] font-semibold tracking-[0.3em] uppercase">
          BYOK Mode
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-foreground drop-shadow-sm">
          NO CREDIT TIERS
        </h1>
        <p className="text-muted font-medium text-xs uppercase tracking-widest max-w-xl mx-auto leading-loose">
          This build runs with your own Seedance-compatible endpoint.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="p-6 rounded-lg bg-glass-bg backdrop-blur-3xl border border-glass-border shadow-sm"
            >
              <div className="w-10 h-10 rounded-md bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6">
                <Icon />
              </div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                {item.title}
              </h2>
              <p className="text-xs text-muted font-medium leading-relaxed">
                {item.body}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-5xl mx-auto flex justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-primary-500 text-white rounded-md text-xs font-semibold uppercase tracking-widest hover:bg-primary-600 transition-colors"
        >
          Open Generator
        </Link>
      </div>
    </div>
  );
}
