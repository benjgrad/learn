"use client";

import confetti from "canvas-confetti";

export function celebrateInteraction(color: string = "#8b5cf6") {
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.7 },
    colors: [color, "#fbbf24", "#60a5fa"],
    scalar: 0.8,
    ticks: 60,
  });
}

export function celebrateModule(color: string = "#3b82f6") {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [color, "#fbbf24", "#10b981", "#8b5cf6"],
    scalar: 1,
    ticks: 120,
  });
}

export function celebrateLevel() {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#fbbf24", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6"],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#fbbf24", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
