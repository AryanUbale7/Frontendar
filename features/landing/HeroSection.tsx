"use client";

import React from "react";

export function HeroSection() {
  return (
    <section id="hero" className="w-full relative overflow-hidden bg-white flex justify-center items-center">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
        <img
          src="/hero.png"
          alt="Frontend Arena Hero"
          className="w-full h-auto max-h-[calc(100vh-100px)] object-contain mx-auto block rounded-2xl"
        />
      </div>
    </section>
  );
}
