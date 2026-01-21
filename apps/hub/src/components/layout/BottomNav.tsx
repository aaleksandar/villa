"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Home, Compass, User } from "lucide-react";
import { clsx } from "clsx";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

interface BottomNavProps {
  activeId: string;
  onNavigate: (id: string) => void;
  items?: NavItem[];
}

const defaultItems: NavItem[] = [
  { id: "home", label: "Home", icon: <Home className="w-6 h-6" /> },
  { id: "ecosystem", label: "Apps", icon: <Compass className="w-6 h-6" /> },
  { id: "profile", label: "Profile", icon: <User className="w-6 h-6" /> },
];

export function BottomNav({
  activeId,
  onNavigate,
  items = defaultItems,
}: BottomNavProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <div className="bg-cream-50/95 backdrop-blur-md border-t border-neutral-100 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-4">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  onNavigate(item.id);
                }}
                className={clsx(
                  "relative flex flex-col items-center justify-center gap-1",
                  "min-w-[64px] min-h-11 px-3 py-2 rounded-xl",
                  "transition-colors duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
                  isActive ? "text-ink" : "text-ink-muted",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && !shouldReduceMotion && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-accent-yellow/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {isActive && shouldReduceMotion && (
                  <div className="absolute inset-0 bg-accent-yellow/20 rounded-xl" />
                )}
                <span className="relative z-10">{item.icon}</span>
                <span className="relative z-10 text-xs font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
