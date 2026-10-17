"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  X,
  Copy,
  Eye,
  MoreVertical,
  ChevronDown,
  LayoutGrid,
  List,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { Account, PortalType } from "@/types";
import { filterAccounts } from "@/lib/search";
import { useToast } from "@/lib/toast-context";
import { dataService } from "@/lib/data-service";

export default function AccountsPage() {
  const {
    accounts,
    environments,
    tags,
    openAccountDetail,
    openAddAccount,
    openEditAccount,
    openDuplicateAccount,
    deleteAccount,
  } = useAppShell();
  const { success, error } = useToast();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("all");
  const [selectedPortal, setSelectedPortal] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<"all" | "any">("all");
  const [sortBy, setSortBy] = useState<"updatedAt" | "name" | "environmentId">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI state
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return filterAccounts(accounts, {
      search: searchTerm,
      environmentId: selectedEnv,
      portal: selectedPortal,
      role: selectedRole,
      tags: selectedTags,
      tagMatchMode,
      sortBy,
      sortOrder,
    });
  }, [
    accounts,
    searchTerm,
    selectedEnv,
    selectedPortal,
    selectedRole,
    selectedTags,
    tagMatchMode,
    sortBy,
    sortOrder,
  ]);

  // Paginated accounts
  const totalAccounts = filteredAccounts.length;
  const totalPages = Math.max(1, Math.ceil(totalAccounts / pageSize));
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, currentPage, pageSize]);

  // Active filter checks
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedEnv !== "all" ||
    selectedPortal !== "all" ||
    selectedRole !== "all" ||
    selectedTags.length > 0;

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedEnv("all");
    setSelectedPortal("all");
    setSelectedRole("all");
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const handleCopyCredentials = async (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    try {
      const pwd = await dataService.revealAccountPassword(account.id);
      const text = `${account.username}/${pwd}`;
      await navigator.clipboard.writeText(text);
      setCopiedAccount(account.id);
      success("Credentials copied", text);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch {
      await navigator.clipboard.writeText(account.username);
      setCopiedAccount(account.id);
      success("Username copied", account.username);
      setTimeout(() => setCopiedAccount(null), 2000);
    }
  };

  useEffect(() => {
    const handleDocClick = () => {
      setOpenActionMenuId(null);
      setTagsDropdownOpen(false);
    };
    window.addEventListener("click", handleDocClick);
    return () => window.removeEventListener("click", handleDocClick);
  }, []);


  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getEnvBadgeColor = (envId: string) => {
    if (envId.startsWith("SIT")) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (envId.startsWith("DEV")) return "bg-teal-50 text-teal-800 border-teal-200";
    if (envId.startsWith("UAT")) return "bg-amber-50 text-amber-800 border-amber-200";
    if (envId.startsWith("STG")) return "bg-purple-50 text-purple-800 border-purple-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-700">Home</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-800 font-medium">Accounts</span>
      </nav>

      {/* Page Title & Add Account Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Accounts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Find the right account, fast.
          </p>
        </div>

        <button
          onClick={() => openAddAccount()}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Filter Toolbar (Matches Screenshot Layout) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search accounts, environments, tags..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Environment Filter */}
          <div className="relative">
            <select
              value={selectedEnv}
              onChange={(e) => {
                setSelectedEnv(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-emerald-600 appearance-none pr-7 cursor-pointer hover:bg-slate-50"
            >
              <option value="all">Environment: All</option>
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Portal Filter */}
          <div className="relative">
            <select
              value={selectedPortal}
              onChange={(e) => {
                setSelectedPortal(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-emerald-600 appearance-none pr-7 cursor-pointer hover:bg-slate-50"
            >
              <option value="all">Portal: All</option>
              <option value="CP">Consumer Portal (CP)</option>
              <option value="WP">Worker Portal (WP)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-emerald-600 appearance-none pr-7 cursor-pointer hover:bg-slate-50"
            >
              <option value="all">Role: All</option>
              <option value="Employee">Employee</option>
              <option value="Broker">Broker</option>
              <option value="Employer">Employer</option>
              <option value="Admin">Admin</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>


          {/* Tags Dropdown Selector */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTagsDropdownOpen(!tagsDropdownOpen);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Tags {selectedTags.length > 0 ? `(${selectedTags.length})` : ""}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {tagsDropdownOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-40"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
                  <span>Filter by Tags</span>
                  <div className="flex items-center space-x-1 text-[10px] font-normal text-slate-500">
                    <button
                      onClick={() => setTagMatchMode(tagMatchMode === "all" ? "any" : "all")}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-medium"
                    >
                      Mode: {tagMatchMode.toUpperCase()}
                    </button>
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {tags.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">No tags found</p>
                  ) : (
                    tags.map((tag) => {
                      const isChecked = selectedTags.includes(tag.name);
                      const count = accounts.filter((a) => a.tags.includes(tag.name)).length;
                      return (
                        <label
                          key={tag.id}
                          className="flex items-center justify-between text-xs text-slate-700 hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedTags((prev) =>
                                  isChecked
                                    ? prev.filter((t) => t !== tag.name)
                                    : [...prev, tag.name]
                                );
                                setCurrentPage(1);
                              }}
                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                            />
                            <span className="truncate">{tag.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">
                            {count}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear All Action */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1.5 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Active Filter Chips & View Mode Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedEnv !== "all" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                Environment: {selectedEnv}
                <button
                  onClick={() => setSelectedEnv("all")}
                  className="ml-1 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedRole !== "all" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                Role: {selectedRole}
                <button
                  onClick={() => setSelectedRole("all")}
                  className="ml-1 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                Tags: {tag}
                <button
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                  className="ml-1 text-emerald-600 hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-3 ml-auto">
            {/* Sort by */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="font-medium text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer text-xs"
              >
                <option value="updatedAt">Last updated</option>
                <option value="name">Account Name</option>
                <option value="environmentId">Environment</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1 rounded ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / Grid */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Username</th>
                  <th className="py-3 px-3 font-semibold">Environment</th>
                  <th className="py-3 px-3 font-semibold">Portal</th>
                  <th className="py-3 px-3 font-semibold">Role</th>
                  <th className="py-3 px-3 font-semibold">Tags</th>
                  <th className="py-3 px-3 font-semibold">Updated</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No accounts matched your filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account, idx) => {
                    return (
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
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getEnvBadgeColor(
                              account.environmentId
                            )}`}
                          >
                            {account.environmentId}
                          </span>
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
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {account.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                              >
                                {tag}
                              </span>
                            ))}
                            {account.tags.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                +{account.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {formatRelativeTime(account.updatedAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Copy credentials button */}
                            <button
                              onClick={(e) => handleCopyCredentials(e, account)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              title="Copy <username>/<password>"
                            >
                              {copiedAccount === account.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* View / reveal drawer */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openAccountDetail(account);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="View account details & credentials"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* More Options Dropdown */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionMenuId(
                                    openActionMenuId === account.id ? null : account.id
                                  );
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {openActionMenuId === account.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute right-0 ${
                                    idx >= paginatedAccounts.length - 2 ? "bottom-full mb-1" : "top-full mt-1"
                                  } w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-left`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      openAccountDetail(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      openEditAccount(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center"
                                  >
                                    Edit Account
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      openDuplicateAccount(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center"
                                  >
                                    Duplicate Metadata
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionMenuId(null);
                                      deleteAccount(account);
                                    }}
                                    className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center"
                                  >
                                    Delete Account
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing {totalAccounts === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalAccounts)} of {totalAccounts} accounts
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-6 h-6 rounded text-xs font-semibold ${
                      currentPage === pageNum
                        ? "bg-emerald-800 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-2 px-2 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedAccounts.map((account) => (
            <div
              key={account.id}
              onClick={() => openAccountDetail(account)}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold font-mono text-slate-900 text-sm">@{account.username}</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getEnvBadgeColor(
                    account.environmentId
                  )}`}
                >
                  {account.environmentId}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    account.portal === "CP"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {account.portal}
                </span>
                <span className="text-slate-600">{account.role}</span>
              </div>

              {account.tags.length > 0 && (
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
