"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Layers,
  Search,
  ArrowRight,
  Edit2,
  Users,
} from "lucide-react";
import { Environment, Account } from "@/types";
import { useToast } from "@/lib/toast-context";

interface EnvironmentDetailDrawerProps {
  environment: Environment | null;
  accounts: Account[];
  onClose: () => void;
  onEdit: (env: Environment) => void;
  onAddAccount: (environmentId: string) => void;
  onSelectAccount: (account: Account) => void;
}

export function EnvironmentDetailDrawer({
  environment,
  accounts,
  onClose,
  onEdit,
  onAddAccount,
  onSelectAccount,
}: EnvironmentDetailDrawerProps) {
  const { success, error, info } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (!environment) return null;

  const associatedAccounts = accounts.filter(
    (a) => a.environmentId === environment.id
  );

  const filteredAccounts = associatedAccounts.filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      a.username.toLowerCase().includes(term) ||
      a.role.toLowerCase().includes(term) ||
      a.portal.toLowerCase().includes(term) ||
      a.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  const handleCopyUrl = (url: string, label: string) => {
    if (!url) {
      info(`${label} URL empty`, "No URL has been configured for this portal yet.");
      return;
    }
    navigator.clipboard.writeText(url);
    setCopiedUrl(label);
    success(`${label} URL copied to clipboard`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleOpenUrl = (url: string, label: string) => {
    if (!url) {
      info(
        `${label} URL not configured`,
        `Please edit ${environment.name} to add the portal endpoint.`
      );
      return;
    }
    try {
      const parsed = new URL(url);
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    } catch {
      error("Invalid URL format");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {environment.name}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                environment.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {environment.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          {environment.description ? (
            <p className="text-xs text-slate-500 mt-1">
              {environment.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(environment)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            title="Edit environment"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Portal Destinations */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Portal Destinations
          </h3>

          <div className="space-y-3">
            {/* Consumer Portal Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-sky-500 mr-2" />
                  Consumer Portal (CP)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Brokers, Employers, Employees
                </span>
              </div>

              <div className="text-xs font-mono truncate py-1 text-slate-600">
                {environment.cpUrl || (
                  <span className="italic text-slate-400 font-sans">
                    No URL set
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                <button
                  onClick={() => handleCopyUrl(environment.cpUrl, "CP")}
                  disabled={!environment.cpUrl}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  {copiedUrl === "CP" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Copy CP URL</span>
                </button>

                <button
                  onClick={() => handleOpenUrl(environment.cpUrl, "CP")}
                  disabled={!environment.cpUrl}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open CP</span>
                </button>
              </div>
            </div>

            {/* Worker Portal Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                  Worker Portal / Admin Portal (WP)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Admin
                </span>
              </div>

              <div className="text-xs font-mono truncate py-1 text-slate-600">
                {environment.wpUrl || (
                  <span className="italic text-slate-400 font-sans">
                    No URL set
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                <button
                  onClick={() => handleCopyUrl(environment.wpUrl, "WP")}
                  disabled={!environment.wpUrl}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  {copiedUrl === "WP" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Copy WP URL</span>
                </button>

                <button
                  onClick={() => handleOpenUrl(environment.wpUrl, "WP")}
                  disabled={!environment.wpUrl}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open WP</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Associated Accounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Environment Accounts ({associatedAccounts.length})
            </h3>
            <button
              onClick={() => onAddAccount(environment.id)}
              className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          </div>

          {/* Search box if there are accounts */}
          {associatedAccounts.length > 2 && (
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter accounts in this environment..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>
          )}

          {associatedAccounts.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500 font-medium">
                No test accounts in {environment.name} yet.
              </p>
              <button
                onClick={() => onAddAccount(environment.id)}
                className="mt-3 inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add First Account for {environment.name}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount(acc)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer transition-colors group"
                >
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold font-mono text-slate-900 group-hover:text-emerald-700 transition-colors">
                        @{acc.username}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          acc.portal === "CP"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {acc.portal}
                      </span>
                      <span className="text-xs text-slate-500">{acc.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
