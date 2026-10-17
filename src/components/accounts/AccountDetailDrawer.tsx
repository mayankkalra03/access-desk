"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  Layers,
  Building,
  FileText,
  User,
  Calendar,
  Lock,
  Edit2,
  Trash2,
  CopyPlus,
} from "lucide-react";
import { Account, Environment } from "@/types";
import { useToast } from "@/lib/toast-context";
import { dataService } from "@/lib/data-service";

interface AccountDetailDrawerProps {
  account: Account | null;
  environment?: Environment;
  onClose: () => void;
  onEdit: (account: Account) => void;
  onDuplicate: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountDetailDrawer({
  account,
  environment,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: AccountDetailDrawerProps) {
  const { success, error, info } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "credentials" | "activity">("overview");

  // Credential state (masked by default, never cached after close)
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Clear credentials when drawer is closed or account changes
  useEffect(() => {
    setRevealedPassword(null);
    setLoadingPassword(false);
    setActiveTab("overview");
  }, [account?.id]);

  if (!account) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(account.username);
    setCopiedField("username");
    success("Username copied to clipboard", account.username);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRevealPassword = async () => {
    if (revealedPassword !== null) {
      setRevealedPassword(null);
      return;
    }

    setLoadingPassword(true);
    try {
      const pwd = await dataService.revealAccountPassword(account.id);
      setRevealedPassword(pwd);
    } catch (err: any) {
      error("Unable to reveal credential", err?.message || "Authorization check failed");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleCopyPassword = async () => {
    try {
      let pwd = revealedPassword;
      if (!pwd) {
        pwd = await dataService.revealAccountPassword(account.id);
      }
      navigator.clipboard.writeText(pwd);
      setCopiedField("password");
      success("Password securely copied to clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err: any) {
      error("Unable to copy password", err?.message || "Authorization check failed");
    }
  };

  const handleOpenPortal = () => {
    const portalUrl = account.portal === "CP" ? environment?.cpUrl : environment?.wpUrl;
    if (!portalUrl || portalUrl.trim() === "") {
      info(
        "Portal URL not configured",
        `The ${account.portal === "CP" ? "Consumer Portal (CP)" : "Worker Portal (WP)"} URL for ${account.environmentId} has not been set yet.`
      );
      return;
    }

    try {
      const url = new URL(portalUrl);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
    } catch {
      error("Invalid URL", "The configured portal URL is invalid.");
    }
  };

  const formattedUpdated = new Date(account.updatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const portalFullName =
    account.portal === "CP" ? "Consumer Portal (CP)" : "Worker Portal / Admin Portal (WP)";

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-emerald-800 text-white font-bold text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            {getInitials(account.username)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold font-mono text-slate-900 leading-tight">
                {account.username}
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {account.environmentId} · {account.portal === "CP" ? "Consumer Portal" : "Worker Portal"} · {account.role}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close detail panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 text-sm font-medium border-b-2 mr-6 transition-colors ${
            activeTab === "overview"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("credentials")}
          className={`py-3 text-sm font-medium border-b-2 mr-6 transition-colors ${
            activeTab === "credentials"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Credentials
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "activity"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Activity
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "overview" && (
          <>
            {/* Account Information List */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Account Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div className="flex items-center text-slate-500">
                    <Layers className="w-4 h-4 mr-2.5 text-slate-400" />
                    <span>Environment</span>
                  </div>
                  <span className="font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded text-xs">
                    {account.environmentId}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div className="flex items-center text-slate-500">
                    <ExternalLink className="w-4 h-4 mr-2.5 text-slate-400" />
                    <span>Portal</span>
                  </div>
                  <span className="text-slate-800 font-medium">{portalFullName}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div className="flex items-center text-slate-500">
                    <User className="w-4 h-4 mr-2.5 text-slate-400" />
                    <span>Role</span>
                  </div>
                  <span className="text-slate-800 font-medium">{account.role}</span>
                </div>


                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <div className="flex items-center text-slate-500">
                    <User className="w-4 h-4 mr-2.5 text-slate-400" />
                    <span>Username</span>
                  </div>
                  <span className="font-mono text-xs text-slate-800 font-semibold bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    {account.username}
                  </span>
                </div>

                {account.organization && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <div className="flex items-center text-slate-500">
                      <Building className="w-4 h-4 mr-2.5 text-slate-400" />
                      <span>Organization</span>
                    </div>
                    <span className="text-slate-800 text-xs text-right max-w-[200px] truncate">
                      {account.organization}
                    </span>
                  </div>
                )}

                {account.notes && (
                  <div className="py-2">
                    <div className="flex items-center text-slate-500 mb-1.5">
                      <FileText className="w-4 h-4 mr-2 text-slate-400" />
                      <span>Notes</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      {account.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {account.tags && account.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {account.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {/* Open Portal */}
                <button
                  onClick={handleOpenPortal}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-sm font-medium text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <span>Open Portal</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {account.portal === "CP" ? "CP" : "WP"}
                  </span>
                </button>

                {/* Copy Username */}
                <button
                  onClick={handleCopyUsername}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-sm font-medium text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    {copiedField === "username" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Copy Username</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {copiedField === "username" ? "Copied!" : account.username}
                  </span>
                </button>

                {/* Copy Password */}
                <button
                  onClick={handleCopyPassword}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-sm font-medium text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    {copiedField === "password" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Copy Password</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {copiedField === "password" ? "Copied!" : "AES Encrypted"}
                  </span>
                </button>

                {/* Reveal Password */}
                <button
                  onClick={handleRevealPassword}
                  disabled={loadingPassword}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-sm font-medium text-slate-800"
                >
                  <div className="flex items-center space-x-2.5">
                    {revealedPassword !== null ? (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-500" />
                    )}
                    <span>
                      {loadingPassword
                        ? "Decrypting..."
                        : revealedPassword !== null
                        ? "Hide Password"
                        : "Reveal Password"}
                    </span>
                  </div>
                  {revealedPassword !== null && (
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {revealedPassword}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Last Updated */}
            <div className="pt-2 text-xs text-slate-400 border-t border-slate-100">
              Last Updated: {formattedUpdated}
            </div>
          </>
        )}

        {activeTab === "credentials" && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Username
                </label>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-900">
                  <span>{account.username}</span>
                  <button
                    onClick={handleCopyUsername}
                    className="text-slate-400 hover:text-slate-700"
                    title="Copy username"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Password Credential
                </label>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-sm text-slate-900">
                  <span>
                    {revealedPassword !== null
                      ? revealedPassword
                      : "••••••••••••••••"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleRevealPassword}
                      className="text-slate-400 hover:text-slate-700"
                      title={revealedPassword ? "Hide" : "Reveal"}
                    >
                      {revealedPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCopyPassword}
                      className="text-slate-400 hover:text-slate-700"
                      title="Copy password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Record Created</span>
                <span className="text-slate-800 font-medium">
                  {new Date(account.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Last Modified</span>
                <span className="text-slate-800 font-medium">{formattedUpdated}</span>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-slate-500">Record ID</span>
                <span className="font-mono text-slate-500 text-[10px]">{account.id}</span>
              </div>
            </div>

            {/* Management Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => onEdit(account)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Account Details</span>
              </button>

              <button
                onClick={() => onDuplicate(account)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <CopyPlus className="w-3.5 h-3.5" />
                <span>Duplicate Account Metadata</span>
              </button>

              <button
                onClick={() => onDelete(account)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
