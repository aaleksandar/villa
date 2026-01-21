"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Home, Compass, Settings, LogOut, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui";
import type { AvatarConfig } from "@/types";

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  user: {
    displayName: string;
    address: string;
    avatar?: AvatarConfig | string;
  };
  onSettingsClick: () => void;
  onLogout: () => void;
  ecosystemApps?: { id: string; name: string; icon?: string }[];
}

const defaultNavItems: SidebarNavItem[] = [
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
  {
    id: "ecosystem",
    label: "Ecosystem",
    icon: <Compass className="w-5 h-5" />,
  },
];

export function Sidebar({
  activeId,
  onNavigate,
  user,
  onSettingsClick,
  onLogout,
  ecosystemApps = [],
}: SidebarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <aside className="hidden sm:flex flex-col w-64 h-screen bg-cream-50 border-r border-neutral-100">
      <div className="p-6">
        <h1 className="text-2xl font-serif text-ink">Villa</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {defaultNavItems.map((item) => {
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                "relative w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
                "min-h-11",
                isActive
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink hover:bg-cream-100",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && !shouldReduceMotion && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute inset-0 bg-accent-yellow/20 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {isActive && shouldReduceMotion && (
                <div className="absolute inset-0 bg-accent-yellow/20 rounded-xl" />
              )}
              <span className="relative z-10">{item.icon}</span>
              <span className="relative z-10 font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="relative z-10 ml-auto px-2 py-0.5 text-xs font-medium bg-accent-yellow text-accent-brown rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {ecosystemApps.length > 0 && (
          <div className="pt-4">
            <p className="px-4 py-2 text-xs text-ink-muted uppercase tracking-wide">
              Apps
            </p>
            {ecosystemApps.map((app) => (
              <button
                key={app.id}
                onClick={() => onNavigate(`app-${app.id}`)}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg",
                  "text-ink-muted hover:text-ink hover:bg-cream-100",
                  "transition-colors duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
                  "min-h-11",
                )}
              >
                {app.icon ? (
                  <img src={app.icon} alt="" className="w-5 h-5 rounded" />
                ) : (
                  <div className="w-5 h-5 rounded bg-cream-200" />
                )}
                <span className="text-sm">{app.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-neutral-100 space-y-2">
        <button
          onClick={onSettingsClick}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
            "text-ink-muted hover:text-ink hover:bg-cream-100",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
            "min-h-11",
          )}
        >
          <Avatar
            name={user.displayName}
            src={user.avatar}
            walletAddress={user.address}
            size="sm"
          />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-ink">@{user.displayName}</p>
            <p className="text-xs text-ink-muted">
              {user.address.slice(0, 6)}...{user.address.slice(-4)}
            </p>
          </div>
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={onLogout}
          className={clsx(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
            "text-ink-muted hover:text-ink hover:bg-cream-100",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:ring-offset-2",
            "min-h-11",
          )}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
