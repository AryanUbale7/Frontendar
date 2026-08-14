"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface GatekeeperWrapperProps {
  children: React.ReactNode;
}

export function GatekeeperWrapper({ children }: GatekeeperWrapperProps) {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [taps, setTaps] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [subscribed, setSubsubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);
    const bypass = localStorage.getItem("fa_bypass_coming_soon");
    if (bypass === "true") {
      setUnlocked(true);
    }

    // Set countdown target date (e.g. 15 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 12); // 12 days countdown

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogoTap = () => {
    const nextTaps = taps + 1;
    setTaps(nextTaps);

    if (nextTaps >= 10) {
      setUnlocked(true);
      localStorage.setItem("fa_bypass_coming_soon", "true");
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubsubscribed(true);
      setEmail("");
    }, 1200);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-body selection:bg-blue-600/30">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[120px] pointer-events-none" />

      {/* Main Glass Container */}
      <div className="relative max-w-xl w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 md:p-10 shadow-2xl flex flex-col items-center z-10">
        
        {/* Interactive Glowing Logo Header */}
        <div 
          onClick={handleLogoTap}
          className="cursor-pointer transition-all duration-300 transform active:scale-95 group relative mb-6"
          title="Frontend Arena Logo"
        >
          <div 
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black p-2 shadow-xl border border-slate-800 transition-all duration-300 relative overflow-hidden"
            style={{
              boxShadow: taps > 0 ? `0 0 ${taps * 4}px rgba(59, 130, 246, ${taps * 0.1})` : "none",
              borderColor: taps > 0 ? `rgba(59, 130, 246, ${taps * 0.1})` : "rgb(30, 41, 59)"
            }}
          >
            <img
              src="/logo.png"
              alt="Frontend Arena"
              className="h-full w-full object-contain"
            />
            {taps > 0 && taps < 10 && (
              <span className="absolute inset-0 bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400 select-none animate-pulse">
                {taps}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-center tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Frontend Arena
        </h1>
        
        {/* Badges / Under Construction Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-6">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>Platform Upgrades In Progress</span>
        </div>

        <p className="text-slate-400 text-center text-sm md:text-base leading-relaxed mb-8 max-w-sm">
          We are deploying major engine enhancements, security audits, and optimized scoring pipelines to bring you the premium hackathon experience.
        </p>

        {/* Custom Premium Countdown Timer */}
        <div className="grid grid-cols-4 gap-3 md:gap-4 w-full max-w-sm mb-8">
          {[
            { label: "DAYS", val: timeLeft.days },
            { label: "HOURS", val: timeLeft.hours },
            { label: "MINS", val: timeLeft.minutes },
            { label: "SECS", val: timeLeft.seconds },
          ].map((item) => (
            <div 
              key={item.label} 
              className="flex flex-col items-center justify-center p-3 bg-slate-950/60 border border-slate-900/80 rounded-xl shadow-inner min-w-[70px]"
            >
              <span className="text-2xl font-bold font-heading text-blue-400 tabular-nums">
                {String(item.val).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-slate-500 tracking-wider mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Optimization Bar */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>AUDITS & ENGINES DEPLOYED</span>
            <span className="text-blue-400">95%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full animate-pulse" style={{ width: "95%" }} />
          </div>
        </div>

        {/* Interactive Subscription / Updates Form */}
        <div className="w-full max-w-md">
          {subscribed ? (
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm gap-2 animate-fade-in">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium text-center">Subscription confirmed! We will alert you at launch.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter email for early access"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 rounded-xl text-sm placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Notify</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[10px] font-medium text-slate-600 tracking-wider pointer-events-none">
        POWERED BY FAIE v3 STATIC INTELLIGENCE
      </div>
    </div>
  );
}
