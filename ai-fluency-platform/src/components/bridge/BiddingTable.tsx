"use client";

interface BiddingTableProps {
  auction: string[];
  dealer?: "north" | "east" | "south" | "west";
  highlightIndex?: number;
}

const DEALER_ORDER = ["west", "north", "east", "south"] as const;
const COLUMN_LABELS = ["West", "North", "East", "South"];

function formatBid(bid: string): { text: string; className: string } {
  if (bid === "Pass" || bid === "pass") {
    return { text: "Pass", className: "text-muted-foreground" };
  }
  if (bid === "X" || bid === "Dbl") {
    return { text: "Dbl", className: "text-red-500 font-semibold" };
  }
  if (bid === "XX" || bid === "Rdbl") {
    return { text: "Rdbl", className: "text-blue-500 font-semibold" };
  }

  // Replace suit letters with colored symbols
  const level = bid.slice(0, -1);
  const suitChar = bid.slice(-1).toUpperCase();

  const suitMap: Record<string, { symbol: string; color: string }> = {
    S: { symbol: "\u2660", color: "text-foreground" },
    H: { symbol: "\u2665", color: "text-red-500" },
    D: { symbol: "\u2666", color: "text-red-500" },
    C: { symbol: "\u2663", color: "text-foreground" },
    N: { symbol: "NT", color: "text-foreground" },
  };

  const suit = suitMap[suitChar];
  if (!suit) {
    return { text: bid, className: "text-foreground" };
  }

  return {
    text: `${level}${suit.symbol}`,
    className: suit.color + " font-medium",
  };
}

export function BiddingTable({
  auction,
  dealer = "south",
  highlightIndex,
}: BiddingTableProps) {
  // Calculate how many empty cells before the first bid
  const dealerIdx = DEALER_ORDER.indexOf(dealer);
  const emptyCellsBefore = dealerIdx;

  // Build rows: each row has 4 cells (West, North, East, South)
  const cells: (string | null)[] = [];
  for (let i = 0; i < emptyCellsBefore; i++) {
    cells.push(null);
  }
  for (const bid of auction) {
    cells.push(bid);
  }

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 4) {
    rows.push(cells.slice(i, i + 4));
  }
  // Pad last row
  const lastRow = rows[rows.length - 1];
  if (lastRow) {
    while (lastRow.length < 4) {
      lastRow.push(null);
    }
  }

  let bidCounter = -1;

  return (
    <div className="my-3 rounded-lg bg-emerald-900/10 dark:bg-emerald-900/20 p-3 overflow-x-auto">
      <div className="grid grid-cols-4 gap-px min-w-[240px]">
        {/* Header */}
        {COLUMN_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-muted-foreground py-1 border-b border-border/50"
          >
            {label}
          </div>
        ))}

        {/* Bid cells */}
        {rows.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (cell !== null) {
              bidCounter++;
            }
            const isHighlighted = cell !== null && bidCounter === highlightIndex;
            const formatted = cell !== null ? formatBid(cell) : null;

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`text-center py-1.5 px-1 text-sm ${
                  rowIdx % 2 === 1
                    ? "bg-muted/30"
                    : ""
                } ${
                  isHighlighted
                    ? "ring-2 ring-amber-400 rounded bg-amber-50/50 dark:bg-amber-950/30"
                    : ""
                }`}
              >
                {formatted ? (
                  <span className={formatted.className}>{formatted.text}</span>
                ) : (
                  <span className="text-muted-foreground/30">&mdash;</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
