"use client";

import { PlayingCard } from "./PlayingCard";

interface CardHandProps {
  cards: string[];
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function CardHand({ cards, size = "md", label }: CardHandProps) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex gap-1">
        {cards.map((card, i) => (
          <PlayingCard key={`${card}-${i}`} card={card} size={size} />
        ))}
      </div>
    </div>
  );
}
