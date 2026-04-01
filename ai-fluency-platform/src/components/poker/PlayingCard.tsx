"use client";

const SUIT_DATA: Record<string, { color: string; symbol: string; path: string }> = {
  h: {
    color: "#dc2626",
    symbol: "♥",
    path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  },
  d: {
    color: "#dc2626",
    symbol: "♦",
    path: "M12 2L5 12l7 10 7-10z",
  },
  c: {
    color: "#1e293b",
    symbol: "♣",
    path: "M12 2C9.79 2 8 3.79 8 6c0 1.48.81 2.77 2 3.46V8c-1.1 0-3 .9-3 3s1.9 3 3 3h1v2h-1v2h4v-2h-1v-2h1c1.1 0 3-.9 3-3s-1.9-3-3-3v1.46c1.19-.69 2-1.98 2-3.46 0-2.21-1.79-4-4-4z",
  },
  s: {
    color: "#1e293b",
    symbol: "♠",
    path: "M12 2L5 12c0 3.31 2.69 5 5 5h-1v3h6v-3h-1c2.31 0 5-1.69 5-5L12 2z",
  },
};

const RANK_DISPLAY: Record<string, string> = {
  A: "A", "2": "2", "3": "3", "4": "4", "5": "5",
  "6": "6", "7": "7", "8": "8", "9": "9", T: "10",
  J: "J", Q: "Q", K: "K",
};

const SIZES = {
  sm: { width: 44, height: 62, fontSize: 11, suitSize: 14, cornerOffset: 4 },
  md: { width: 60, height: 84, fontSize: 14, suitSize: 20, cornerOffset: 5 },
  lg: { width: 80, height: 112, fontSize: 18, suitSize: 26, cornerOffset: 6 },
};

interface PlayingCardProps {
  card: string; // e.g. "Ah", "Ts", "back"
  size?: "sm" | "md" | "lg";
}

export function PlayingCard({ card, size = "md" }: PlayingCardProps) {
  const dims = SIZES[size];

  if (card === "back") {
    return (
      <svg
        width={dims.width}
        height={dims.height}
        viewBox={`0 0 ${dims.width} ${dims.height}`}
        className="drop-shadow-sm"
      >
        <rect
          x="1" y="1"
          width={dims.width - 2} height={dims.height - 2}
          rx="4" ry="4"
          fill="#dc2626"
          stroke="#991b1b"
          strokeWidth="1"
        />
        <rect
          x="4" y="4"
          width={dims.width - 8} height={dims.height - 8}
          rx="2" ry="2"
          fill="none"
          stroke="#fca5a5"
          strokeWidth="0.5"
        />
        {/* Diamond pattern */}
        {Array.from({ length: 3 }).map((_, row) =>
          Array.from({ length: 2 }).map((_, col) => {
            const cx = dims.width * (col + 1) / 3;
            const cy = dims.height * (row + 1) / 4;
            return (
              <path
                key={`${row}-${col}`}
                d={`M${cx} ${cy - 6}l4 6-4 6-4-6z`}
                fill="#fca5a5"
                opacity="0.4"
              />
            );
          })
        )}
      </svg>
    );
  }

  const rank = card.slice(0, -1);
  const suit = card.slice(-1);
  const suitData = SUIT_DATA[suit];
  const rankText = RANK_DISPLAY[rank];

  if (!suitData || !rankText) return null;

  const isFaceCard = ["J", "Q", "K"].includes(rank);

  return (
    <svg
      width={dims.width}
      height={dims.height}
      viewBox={`0 0 ${dims.width} ${dims.height}`}
      className="drop-shadow-sm"
    >
      {/* Card background */}
      <rect
        x="1" y="1"
        width={dims.width - 2} height={dims.height - 2}
        rx="4" ry="4"
        fill="white"
        stroke="#d1d5db"
        strokeWidth="1"
      />

      {/* Top-left rank */}
      <text
        x={dims.cornerOffset}
        y={dims.cornerOffset + dims.fontSize}
        fontSize={dims.fontSize}
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        fill={suitData.color}
      >
        {rankText}
      </text>

      {/* Top-left suit symbol */}
      <text
        x={dims.cornerOffset}
        y={dims.cornerOffset + dims.fontSize + dims.suitSize * 0.7}
        fontSize={dims.suitSize * 0.7}
        fontFamily="system-ui, sans-serif"
        fill={suitData.color}
      >
        {suitData.symbol}
      </text>

      {/* Center suit or face indicator */}
      <text
        x={dims.width / 2}
        y={dims.height / 2 + (isFaceCard ? dims.suitSize * 0.3 : dims.suitSize * 0.5)}
        fontSize={isFaceCard ? dims.suitSize * 1.5 : dims.suitSize * 1.8}
        fontFamily="system-ui, sans-serif"
        fill={suitData.color}
        textAnchor="middle"
      >
        {isFaceCard ? rankText : suitData.symbol}
      </text>

      {/* Face card suit underneath */}
      {isFaceCard && (
        <text
          x={dims.width / 2}
          y={dims.height / 2 + dims.suitSize * 1.1}
          fontSize={dims.suitSize * 0.8}
          fontFamily="system-ui, sans-serif"
          fill={suitData.color}
          textAnchor="middle"
        >
          {suitData.symbol}
        </text>
      )}

      {/* Bottom-right rank (rotated) */}
      <g transform={`rotate(180, ${dims.width / 2}, ${dims.height / 2})`}>
        <text
          x={dims.cornerOffset}
          y={dims.cornerOffset + dims.fontSize}
          fontSize={dims.fontSize}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          fill={suitData.color}
        >
          {rankText}
        </text>
        <text
          x={dims.cornerOffset}
          y={dims.cornerOffset + dims.fontSize + dims.suitSize * 0.7}
          fontSize={dims.suitSize * 0.7}
          fontFamily="system-ui, sans-serif"
          fill={suitData.color}
        >
          {suitData.symbol}
        </text>
      </g>
    </svg>
  );
}
