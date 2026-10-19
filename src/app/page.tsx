"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Layers,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Plus,
  Users,
  Search,
  Eye,
  MoreVertical,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { Environment, Account } from "@/types";
import { useToast } from "@/lib/toast-context";
import { dataService } from "@/lib/data-service";
import { matchAccountQuery } from "@/lib/search";

export default function EnvironmentConsolePage() {
  const {
    environments,
    accounts,
    openAccountDetail,
    openAddAccount,
    openEditAccount,
    openDuplicateAccount,
    openEditEnvironment,
    deleteAccount,
  } = useAppShell();
  const { success, info, error } = useToast();

  // Active selected environment (defaults to SIT1 or first environment)
  const [activeEnvId, setActiveEnvId] = useState<string>("SIT1");
  const [accountSearch, setAccountSearch] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const activeEnv = useMemo(() => {
    return environments.find((e) => e.id === activeEnvId) || environments[0];
  }, [environments, activeEnvId]);

  // Accounts belonging to the active environment
  const envAccounts = useMemo(() => {
    if (!activeEnv) return [];
    return accounts.filter((a) => a.environmentId === activeEnv.id);
  }, [accounts, activeEnv]);

  const filteredEnvAccounts = useMemo(() => {
    if (!accountSearch.trim()) return envAccounts;
    return envAccounts.filter((a) => matchAccountQuery(a, accountSearch));
  }, [envAccounts, accountSearch]);

  const handleCopyUrl = (e: React.MouseEvent, url: string, key: string, label: string) => {
    e.stopPropagation();
    if (!url || !url.trim()) {
      info(`${label} URL Not Set`, "Click Configure to set this portal endpoint.");
      return;
    }
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    success(`${label} URL copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenUrl = (e: React.MouseEvent, url: string, label: string) => {
    e.stopPropagation();
    if (!url || !url.trim()) {
      info(`${label} URL Not Configured`, "Click Configure to add this portal destination.");
      return;
    }
    try {
      window.open(new URL(url).toString(), "_blank", "noopener,noreferrer");
    } catch {
      error("Invalid URL format");
    }
  };

  const handleCopyCredentials = async (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    try {
      const pwd = await dataService.revealAccountPassword(account.id);
      const text = `${account.username}/${pwd}`;
      await navigator.clipboard.writeText(text);
      setCopiedKey(account.id);
      success("Credentials copied", text);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      await navigator.clipboard.writeText(account.username);
      setCopiedKey(account.id);
      success("Username copied", account.username);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  useEffect(() => {
    const handleCloseAction = () => setOpenActionId(null);
    window.addEventListener("click", handleCloseAction);
    return () => window.removeEventListener("click", handleCloseAction);
  }, []);

  const cpConfigured = Boolean(activeEnv?.cpUrl && activeEnv.cpUrl.trim());
  const wpConfigured = Boolean(activeEnv?.wpUrl && activeEnv.wpUrl.trim());

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Environment Selector Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              <span>Environment Console</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an environment to manage portal URLs and dedicated test accounts.
            </p>
          </div>
        </div>

        {/* 15 Environments Quick-Switch Bar - Wrapped in clean rows without horizontal scroll */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {environments.map((env) => {
              const count = accounts.filter((a) => a.environmentId === env.id).length;
              const isSelected = env.id === activeEnvId;
              const hasUrls = Boolean(env.cpUrl || env.wpUrl);
              const displayName = env.name.replace(" (Training)", "");

              return (
                <button
                  key={env.id}
                  onClick={() => {
                    setActiveEnvId(env.id);
                    setAccountSearch("");
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    isSelected
                      ? "bg-emerald-800 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 border border-slate-200/70"
                  }`}
                >
                  <span>{displayName}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected
                          ? "bg-emerald-700 text-emerald-100"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {hasUrls && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Endpoints configured" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Environment Workspace */}
      {activeEnv && (
        <div className="space-y-6">
          {/* Environment Header & Portal Cards */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {activeEnv.name}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    activeEnv.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      activeEnv.status === "active" ? "bg-emerald-600" : "bg-slate-400"
                    }`}
                  />
                  {activeEnv.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <button
                onClick={() => openEditEnvironment(activeEnv)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Configure URLs</span>
              </button>
            </div>

            {/* Portal Routing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consumer Portal Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="text-sm font-bold text-slate-900">
                      Consumer Portal (CP)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Broker · Employer · Employee
                  </span>
                </div>

                <div className="font-mono text-xs py-1 text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 truncate min-h-[36px] flex items-center">
                  {cpConfigured ? (
                    <span className="truncate">{activeEnv.cpUrl}</span>
                  ) : (
                    <span className="text-slate-400 italic font-sans text-xs">
                      No URL set
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={(e) => handleCopyUrl(e, activeEnv.cpUrl, `${activeEnv.id}-cp`, "CP")}
                    disabled={!cpConfigured}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    {copiedKey === `${activeEnv.id}-cp` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Copy CP URL</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenUrl(e, activeEnv.cpUrl, "CP")}
                    disabled={!cpConfigured}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open CP</span>
                  </button>
                </div>
              </div>

              {/* Worker Portal / Admin Portal Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-sm font-bold text-slate-900">
                      Worker Portal / Admin (WP)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Admin
                  </span>
                </div>

                <div className="font-mono text-xs py-1 text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 truncate min-h-[36px] flex items-center">
                  {wpConfigured ? (
                    <span className="truncate">{activeEnv.wpUrl}</span>
                  ) : (
                    <span className="text-slate-400 italic font-sans text-xs">
                      No URL set
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={(e) => handleCopyUrl(e, activeEnv.wpUrl, `${activeEnv.id}-wp`, "WP")}
                    disabled={!wpConfigured}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    {copiedKey === `${activeEnv.id}-wp` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Copy WP URL</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenUrl(e, activeEnv.wpUrl, "WP")}
                    disabled={!wpConfigured}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open WP</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts in Active Environment Section */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {activeEnv.name} Accounts ({envAccounts.length})
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                {envAccounts.length > 0 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      placeholder="Filter accounts in this env..."
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600 bg-slate-50"
                    />
                  </div>
                )}

                <button
                  onClick={() => openAddAccount(activeEnv.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Account to {activeEnv.name}</span>
                </button>
              </div>
            </div>

            {/* Accounts Table or Empty State */}
            {filteredEnvAccounts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {accountSearch
                    ? `No accounts matching "${accountSearch}" in ${activeEnv.name}`
                    : `No test accounts created for ${activeEnv.name} yet`}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add accounts with credentials and roles specifically for this environment.
                </p>
                <button
                  onClick={() => openAddAccount(activeEnv.id)}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Account for {activeEnv.name}</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-3">Portal</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Tags</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEnvAccounts.map((account, idx) => (
                      <tr
                        key={account.id}
                        onClick={() => openAccountDetail(account)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {account.username}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              account.portal === "CP"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {account.portal}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {account.role}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {account.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={(e) => handleCopyCredentials(e, account)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Copy <username>/<password>"
                            >
                              {copiedKey === account.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAccountDetail(account);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="Reveal password and view details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionId(openActionId === account.id ? null : account.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {openActionId === account.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute right-0 ${
                                    idx >= filteredEnvAccounts.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                                  } w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-left`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      openAccountDetail(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      openEditAccount(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Edit Account
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      openDuplicateAccount(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    Duplicate Metadata
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionId(null);
                                      deleteAccount(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                  >
                                    Delete Account
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
