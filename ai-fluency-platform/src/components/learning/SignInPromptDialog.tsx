"use client";

import { Button } from "@/components/ui/button";
import { LogIn, X } from "lucide-react";
import Link from "next/link";

interface SignInPromptDialogProps {
  open: boolean;
  remaining: number;
  limit: number;
  onContinue: () => void;
  onClose: () => void;
}

export function SignInPromptDialog({
  open,
  remaining,
  limit,
  onContinue,
  onClose,
}: SignInPromptDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Sign in for more AI uses</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          You have{" "}
          <span className="font-semibold text-foreground">{remaining}</span> of{" "}
          <span className="font-semibold text-foreground">{limit}</span> free AI
          uses remaining today. Sign in to get 50 uses per day.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onContinue}>
            Continue ({remaining} left)
          </Button>
          <Link href="/auth/login" className="flex-1">
            <Button className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
