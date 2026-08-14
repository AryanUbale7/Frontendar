"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Mail, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface GatekeeperWrapperProps {
  children: React.ReactNode;
}

export function GatekeeperWrapper({ children }: GatekeeperWrapperProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail("");
    }, 1200);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden font-body selection:bg-blue-600/10 selection:text-blue-800">
      {/* Decorative Light Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-[100px] pointer-events-none" />

      {/* Main Premium Card */}
      <div className="relative max-w-md w-full bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100 flex flex-col items-center z-10">
        
        {/* Brand Logo Container */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-slate-100 transition-transform duration-300 hover:scale-105">
          <img
            src="/logo.png"
            alt="Frontend Arena"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-bold font-heading text-[#0F172A] tracking-tight mb-2">
          Frontend Arena
        </h1>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 mb-6">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>Under Construction</span>
        </div>

        {/* Main Info */}
        <p className="text-slate-500 text-center text-sm md:text-base leading-relaxed mb-8">
          We are currently upgrading our platform systems and scoring engines. The platform is under construction and will be back online shortly. Thank you for your patience!
        </p>

        {/* Custom Progress Bar */}
        <div className="w-full mb-8">
          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
            <span>UPGRADES COMPLETED</span>
            <span className="text-blue-600">95%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" style={{ width: "95%" }} />
          </div>
        </div>

        {/* Newsletter Form */}
        <div className="w-full">
          {subscribed ? (
            <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm gap-1.5 animate-fade-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-center">Subscription confirmed! We will notify you.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Enter email to get notified"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl text-sm placeholder:text-slate-400 outline-none transition-all text-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
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

      {/* Powered Branding */}
      <div className="absolute bottom-6 text-[10px] font-bold text-slate-400 tracking-wider pointer-events-none">
        POWERED BY FAIE v3
      </div>
    </div>
  );
}
