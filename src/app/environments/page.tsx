"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Plus,
  Users,
} from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { Environment } from "@/types";
import { useToast } from "@/lib/toast-context";

export default function EnvironmentsPage() {
  const {
    environments,
    accounts,
    openEnvironmentDetail,
    openEditEnvironment,
    openAddAccount,
  } = useAppShell();
  const { success, info, error } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredEnvironments = useMemo(() => {
    return environments.filter((env) => {
      if (statusFilter !== "all" && env.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = env.name.toLowerCase().includes(term);
        const matchesDesc = env.description?.toLowerCase().includes(term);
        const matchesCp = env.cpUrl?.toLowerCase().includes(term);
        const matchesWp = env.wpUrl?.toLowerCase().includes(term);
        if (!matchesName && !matchesDesc && !matchesCp && !matchesWp) {
          return false;
        }
      }
      return true;
    });
  }, [environments, searchTerm, statusFilter]);

  const handleCopyUrl = (e: React.MouseEvent, url: string, key: string, label: string) => {
    e.stopPropagation();
    if (!url) {
      info(`${label} URL Not Set`, "This portal URL has not been configured yet.");
      return;
    }
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    success(`${label} URL copied`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenUrl = (e: React.MouseEvent, url: string, label: string) => {
    e.stopPropagation();
    if (!url) {
      info(
        `${label} URL Not Configured`,
        "Please edit the environment to configure this portal URL."
      );
      return;
    }
    try {
      window.open(new URL(url).toString(), "_blank", "noopener,noreferrer");
    } catch {
      error("Invalid URL format");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-700">Home</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-800 font-medium">Environments</span>
      </nav>

      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Environments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All 15 healthcare platform environments with dedicated CP and WP routing.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <span>Total: <strong>15 Environments</strong></span>
          <span>·</span>
          <span className="text-emerald-700">
            <strong>{environments.filter((e) => e.status === "active").length} Active</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search environments by name, portal URL, or description..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Filter Status:</span>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded font-medium ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded font-medium ${
                statusFilter === "active" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-500"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded font-medium ${
                statusFilter === "inactive" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Environments Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEnvironments.map((env) => {
          const envAccounts = accounts.filter((a) => a.environmentId === env.id);
          const cpConfigured = Boolean(env.cpUrl && env.cpUrl.trim());
          const wpConfigured = Boolean(env.wpUrl && env.wpUrl.trim());

          return (
            <div
              key={env.id}
              onClick={() => openEnvironmentDetail(env)}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer p-5 flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-lg font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {env.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        env.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          env.status === "active" ? "bg-emerald-600" : "bg-slate-400"
                        }`}
                      />
                      {env.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditEnvironment(env);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="Configure environment URLs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {env.description ? (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {env.description}
                  </p>
                ) : null}

                {/* Portal Endpoints */}
                <div className="mt-4 space-y-2.5">
                  {/* Consumer Portal row */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />
                        Consumer Portal (CP)
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {cpConfigured ? env.cpUrl : "No URL set"}
                    </p>

                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        onClick={(e) => handleCopyUrl(e, env.cpUrl, `${env.id}-cp`, "CP")}
                        disabled={!cpConfigured}
                        className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1"
                      >
                        {copiedKey === `${env.id}-cp` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                        <span>Copy</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenUrl(e, env.cpUrl, "CP")}
                        disabled={!cpConfigured}
                        className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span>Open CP</span>
                      </button>
                    </div>
                  </div>

                  {/* Worker Portal row */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />
                        Worker Portal (WP)
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {wpConfigured ? env.wpUrl : "No URL set"}
                    </p>

                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        onClick={(e) => handleCopyUrl(e, env.wpUrl, `${env.id}-wp`, "WP")}
                        disabled={!wpConfigured}
                        className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1"
                      >
                        {copiedKey === `${env.id}-wp` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                        <span>Copy</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenUrl(e, env.wpUrl, "WP")}
                        disabled={!wpConfigured}
                        className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 border border-slate-200 flex items-center justify-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span>Open WP</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Account count and add account */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {envAccounts.length} account{envAccounts.length === 1 ? "" : "s"}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddAccount(env.id);
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
