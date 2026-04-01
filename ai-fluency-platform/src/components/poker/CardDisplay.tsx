"use client";

import { CardHand } from "./CardHand";

interface CardDisplayProps {
  hand?: string[];
  board?: string[];
  displayAs?: "hand" | "board" | "both";
  size?: "sm" | "md" | "lg";
}

export function CardDisplay({ hand, board, displayAs = "both", size = "md" }: CardDisplayProps) {
  const showHand = (displayAs === "hand" || displayAs === "both") && hand && hand.length > 0;
  const showBoard = (displayAs === "board" || displayAs === "both") && board && board.length > 0;

  return (
    <div className="flex flex-wrap items-end justify-center gap-4 my-3 p-3 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20">
      {showHand && <CardHand cards={hand} size={size} label="Your Hand" />}
      {showHand && showBoard && (
        <div className="w-px h-12 bg-border hidden sm:block" />
      )}
      {showBoard && <CardHand cards={board} size={size} label="Board" />}
    </div>
  );
}
