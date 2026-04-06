"use client";

import { BiddingTable } from "./BiddingTable";

interface BridgeHandDisplayProps {
  north?: string[];
  south?: string[];
  east?: string[];
  west?: string[];
  auction?: string[];
  displayAs?: "bridge-single" | "bridge-dummy" | "bridge-full" | "bridge-bidding";
  size?: "sm" | "md" | "lg";
}

const SUIT_ORDER = ["S", "H", "D", "C"] as const;
const SUIT_SYMBOLS: Record<string, string> = {
  S: "\u2660",
  H: "\u2665",
  D: "\u2666",
  C: "\u2663",
};
const SUIT_COLORS: Record<string, string> = {
  S: "text-foreground",
  H: "text-red-500",
  D: "text-red-500",
  C: "text-foreground",
};

const RANK_ORDER = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

function parseCard(card: string): { rank: string; suit: string } {
  const suit = card.slice(-1).toUpperCase();
  const rank = card.slice(0, -1).toUpperCase();
  return { rank, suit };
}

function displayRank(rank: string): string {
  if (rank === "T") return "10";
  return rank;
}

function groupBySuit(cards: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = { S: [], H: [], D: [], C: [] };
  for (const card of cards) {
    const { rank, suit } = parseCard(card);
    if (groups[suit]) {
      groups[suit].push(rank);
    }
  }
  // Sort each suit by rank descending
  for (const suit of SUIT_ORDER) {
    groups[suit].sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));
  }
  return groups;
}

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

function HandDisplay({
  cards,
  label,
  size = "md",
}: {
  cards: string[];
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const grouped = groupBySuit(cards);

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <div className="text-xs font-semibold text-muted-foreground mb-1">
          {label}
        </div>
      )}
      {SUIT_ORDER.map((suit) => (
        <div key={suit} className={`flex items-center gap-1 ${SIZE_CLASSES[size]}`}>
          <span className={`${SUIT_COLORS[suit]} font-bold`}>
            {SUIT_SYMBOLS[suit]}
          </span>
          <span className="font-mono tracking-wider">
            {grouped[suit].length > 0
              ? grouped[suit].map(displayRank).join(" ")
              : "\u2014"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BridgeHandDisplay({
  north,
  south,
  east,
  west,
  auction,
  displayAs = "bridge-single",
  size = "md",
}: BridgeHandDisplayProps) {
  // bridge-single: Show only south hand
  if (displayAs === "bridge-single") {
    return (
      <div className="flex items-center justify-center my-3 p-4 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20">
        {south && south.length > 0 && (
          <HandDisplay cards={south} label="Your Hand" size={size} />
        )}
      </div>
    );
  }

  // bridge-dummy: Show south and north
  if (displayAs === "bridge-dummy") {
    return (
      <div className="flex flex-col items-center gap-4 my-3 p-4 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20">
        {north && north.length > 0 && (
          <HandDisplay cards={north} label="Dummy (North)" size={size} />
        )}
        <div className="w-16 h-px bg-border" />
        {south && south.length > 0 && (
          <HandDisplay cards={south} label="Declarer (South)" size={size} />
        )}
      </div>
    );
  }

  // bridge-full: All four hands in compass layout
  if (displayAs === "bridge-full") {
    return (
      <div className="my-3 p-4 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20">
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          {/* Row 1: North centered */}
          <div />
          <div className="flex justify-center">
            {north && north.length > 0 && (
              <HandDisplay cards={north} label="North" size={size} />
            )}
          </div>
          <div />

          {/* Row 2: West and East */}
          <div className="flex justify-center items-center">
            {west && west.length > 0 && (
              <HandDisplay cards={west} label="West" size={size} />
            )}
          </div>
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-border/50 flex items-center justify-center text-xs text-muted-foreground">
              N
            </div>
          </div>
          <div className="flex justify-center items-center">
            {east && east.length > 0 && (
              <HandDisplay cards={east} label="East" size={size} />
            )}
          </div>

          {/* Row 3: South centered */}
          <div />
          <div className="flex justify-center">
            {south && south.length > 0 && (
              <HandDisplay cards={south} label="South" size={size} />
            )}
          </div>
          <div />
        </div>
      </div>
    );
  }

  // bridge-bidding: South hand + auction table
  if (displayAs === "bridge-bidding") {
    return (
      <div className="my-3 space-y-3">
        <div className="flex items-center justify-center p-4 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20">
          {south && south.length > 0 && (
            <HandDisplay cards={south} label="Your Hand" size={size} />
          )}
        </div>
        {auction && auction.length > 0 && (
          <BiddingTable auction={auction} dealer="south" />
        )}
      </div>
    );
  }

  return null;
}
