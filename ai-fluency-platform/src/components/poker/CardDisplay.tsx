"use client";

import { CardHand } from "./CardHand";

interface CardDisplayProps {
  hand?: string[];
  hand1?: string[];
  hand2?: string[];
  board?: string[];
  displayAs?: "hand" | "board" | "both" | "versus";
  size?: "sm" | "md" | "lg";
}

export function CardDisplay({ hand, hand1, hand2, board, displayAs = "both", size = "md" }: CardDisplayProps) {
  const isVersus = displayAs === "versus";
  const showHand = !isVersus && (displayAs === "hand" || displayAs === "both") && hand && hand.length > 0;
  const showBoard = (displayAs === "board" || displayAs === "both" || isVersus) && board && board.length > 0;

  return (
    <div className="flex flex-wrap items-end justify-center gap-4 my-3 p-3 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20">
      {isVersus && hand1 && hand1.length > 0 && <CardHand cards={hand1} size={size} label="Player 1" />}
      {isVersus && hand1 && hand2 && (
        <div className="w-px h-12 bg-border hidden sm:block" />
      )}
      {isVersus && hand2 && hand2.length > 0 && <CardHand cards={hand2} size={size} label="Player 2" />}
      {isVersus && (hand1 || hand2) && showBoard && (
        <div className="w-px h-12 bg-border hidden sm:block" />
      )}
      {showHand && <CardHand cards={hand} size={size} label="Your Hand" />}
      {showHand && showBoard && (
        <div className="w-px h-12 bg-border hidden sm:block" />
      )}
      {showBoard && <CardHand cards={board} size={size} label="Board" />}
    </div>
  );
}
