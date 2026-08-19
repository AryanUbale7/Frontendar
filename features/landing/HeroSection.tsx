"use client";

import React from "react";

export function HeroSection() {
  return (
    <section id="hero" className="w-full relative overflow-hidden bg-white">
      <div className="w-full mx-auto">
        <img
          src="/hero.png"
          alt="Frontend Arena Hero"
          className="w-full h-auto block object-cover md:object-contain"
        />
      </div>
    </section>
  );
}
