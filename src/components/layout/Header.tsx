"use client";

import React, { useState } from "react";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  onOpenSearch: () => void;
}

export function Header({ onOpenSearch }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-20">
      {/* Global Search Input Trigger */}
      <div className="flex-1 max-w-xl">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-100/60 transition-all text-left group"
        >
          <div className="flex items-center space-x-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-slate-500 font-normal">
              Search accounts, environments, tags...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* User Profile Dropdown */}
      <div className="flex items-center space-x-3 ml-4">
        {profile && (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                {getInitials(profile.displayName || profile.email)}
              </div>
              <span className="text-sm font-medium text-slate-800 hidden md:inline">
                {profile.displayName || profile.email}
              </span>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {profile.displayName || "Engineer"}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {profile.email}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
