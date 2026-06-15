"use client";

import React, { useState, useEffect } from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { 
  LayoutDashboard, 
  Brain, 
  MessageSquare, 
  Clock, 
  User 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV_ITEMS = [
  { href: "/home", icon: LayoutDashboard, labelKey: "home" },
  { href: "/dump", icon: Brain, labelKey: "dump" },
  { href: "/chat", icon: MessageSquare, labelKey: "chat" },
  { href: "/history", icon: Clock, labelKey: "history" },
  { href: "/profile", icon: User, labelKey: "profile" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const router = useRouter();
  const supabase = createClient();
  const [initials, setInitials] = useState("OP");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          setInitials(fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
        } else if (user.email) {
          setInitials(user.email.slice(0, 2).toUpperCase());
        }
      }
    };
    fetchUser();
  }, [supabase]);

  // Determine if we should hide the sidebar
  const isFocusMode = pathname.includes("/dump");

  return (
    <div className="flex min-h-screen bg-canvas text-body">
      {/* Desktop Sidebar */}
      {!isFocusMode && (
        <aside className="hidden md:flex flex-col w-64 bg-dark-nav border-r border-hairline sticky top-0 h-screen">
          <div className="p-8">
            <span className="text-xl font-bold tracking-tight text-white">
              OPERA
            </span>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                    isActive 
                      ? "border-primary text-white bg-surface-card" 
                      : "border-transparent text-muted hover:text-white hover:bg-surface-card/50"
                  )}
                >
                  <Icon className="size-5" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0",
        isFocusMode ? "w-full" : ""
      )}>
        {/* Top Header */}
        {!isFocusMode && (
          <header className="h-16 border-b border-hairline flex items-center justify-end px-6 gap-4">
            <LanguageSwitcher />
            <Avatar 
              className="cursor-pointer size-8 hover:ring-2 hover:ring-primary transition-all"
              onClick={() => router.push("/profile")}
            >
              <AvatarFallback className="font-semibold bg-surface-card text-ink">
                {initials}
              </AvatarFallback>
            </Avatar>
          </header>
        )}

        <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-10">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        {!isFocusMode && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-soft border-t border-hairline flex items-center justify-around px-2 z-50">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                    isActive ? "text-primary" : "text-muted"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
}
