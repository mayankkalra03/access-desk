"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Server,
  User,
  ArrowRight,
  ExternalLink,
  Layers,
  Users,
} from "lucide-react";
import { Account, Environment } from "@/types";
import { searchGlobal, GlobalSearchResult } from "@/lib/search";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  environments: Environment[];
  onSelectAccount: (account: Account) => void;
  onSelectEnvironment: (env: Environment) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  accounts,
  environments,
  onSelectAccount,
  onSelectEnvironment,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult>({
    environments: [],
    accounts: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or self
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults({ environments: [], accounts: [] });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults({ environments: [], accounts: [] });
      return;
    }
    const res = searchGlobal(accounts, environments, query);
    setResults(res);
  }, [query, accounts, environments]);

  if (!isOpen) return null;

  const totalMatches = results.environments.length + results.accounts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all 15 environments, accounts, roles, tags, notes..."
            className="w-full text-slate-800 placeholder-slate-400 text-sm bg-transparent focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {query.trim() === "" ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <p>Type to search across environments, accounts, usernames, roles, and tags.</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">SIT1</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">Employee</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">AutoPayments</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">Admin</span>
              </div>
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching by environment ID (e.g. SIT1, DEV2), username, role, or tag.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Environments Group */}
              {results.environments.length > 0 && (
                <div>
                  <div className="flex items-center px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    Environments ({results.environments.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.environments.map((env) => (
                      <button
                        key={env.id}
                        onClick={() => {
                          onSelectEnvironment(env);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                            {env.name}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-sm">
                            {env.description || (env.cpUrl || env.wpUrl ? "Endpoints configured" : "No endpoints set")}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 group-hover:text-emerald-700">
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts Group */}
              {results.accounts.length > 0 && (
                <div>
                  <div className="flex items-center px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Accounts ({results.accounts.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          onSelectAccount(acc);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <span className="font-medium text-sm text-slate-800 truncate">
                            {acc.name}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                            {acc.environmentId}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                              acc.portal === "CP"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {acc.portal}
                          </span>
                          <span className="text-xs text-slate-500">{acc.role}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            @{acc.username}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                          {acc.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600"
                            >
                              {t}
                            </span>
                          ))}
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 ml-1" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {totalMatches > 0 ? `${totalMatches} matching items` : "Search AccessDesk"}
          </span>
          <span className="flex items-center space-x-2">
            <span>Navigation: ↑ ↓</span>
            <span>Select: ↵</span>
          </span>
        </div>
      </div>
    </div>
  );
}
