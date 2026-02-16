"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "ios-install-prompt-dismissed";
const SHOW_DELAY_MS = 3000;
const RE_SHOW_AFTER_DAYS = 30;

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as unknown as { standalone: boolean }).standalone === true);

    if (!isIOS || isStandalone) return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < RE_SHOW_AFTER_DAYS) return;
    }

    const timer = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-background border-t shadow-lg animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <svg
            className="h-6 w-6 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12" />
            <path d="m8 7 4-4 4 4" />
            <rect x="4" y="11" width="16" height="10" rx="2" />
          </svg>
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium">Install AI Fluency</p>
          <p className="text-muted-foreground mt-0.5">
            Tap{" "}
            <svg
              className="inline h-4 w-4 align-text-bottom"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12" />
              <path d="m8 7 4-4 4 4" />
              <rect x="4" y="11" width="16" height="10" rx="2" />
            </svg>{" "}
            <strong>Share</strong> then <strong>&quot;Add to Home Screen&quot;</strong>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
