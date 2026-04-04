"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogIn, LogOut, LayoutDashboard, BookOpen, User } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { XpBadge } from "@/components/review/XpBadge";
import { SparksBadge } from "@/components/sparks/SparksBadge";

export function Header() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
            {/* Mobile-only: badges and sign out */}
            <div className="sm:hidden border-t p-4 space-y-3">
              <div className="flex items-center gap-2">
                <SparksBadge />
                <XpBadge />
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { handleSignOut(); setMobileOpen(false); }}
                  className="gap-1.5 w-full justify-start"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" className="font-bold text-lg">
          Learning Platform
        </Link>

        <nav className="hidden md:flex items-center gap-4 ml-6">
          <Link
            href="/curriculum"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Curriculum
          </Link>
          <Link
            href="/interview"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Interview Me
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Badges: hidden on small screens to prevent overflow */}
          <div className="hidden sm:flex items-center gap-2">
            <SparksBadge />
            <XpBadge />
          </div>
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5 hidden md:flex">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 hidden sm:flex"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium" title={user.email ?? "Signed in"}>
                {user.email ? user.email[0].toUpperCase() : <User className="h-4 w-4" />}
              </div>
            </>
          ) : (
            <>
              <Link href="/curriculum">
                <Button variant="ghost" size="icon" className="md:hidden">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
