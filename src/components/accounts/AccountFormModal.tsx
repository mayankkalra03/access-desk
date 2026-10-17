"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Plus, AlertCircle, Shield } from "lucide-react";
import {
  Account,
  Environment,
  Tag,
  PortalType,
  CPRole,
  WPRole,
  ProductType,
  CP_ROLES,
  WP_ROLES,
  PRODUCTS,
  AccountInput,
  accountFormSchema,
} from "@/types";
import { useToast } from "@/lib/toast-context";

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    account: AccountInput,
    password?: string
  ) => Promise<void>;
  initialAccount?: Account | null;
  environments: Environment[];
  availableTags: Tag[];
  onQuickCreateTag: (name: string) => Promise<Tag>;
  defaultEnvironmentId?: string;
}

export function AccountFormModal({
  isOpen,
  onClose,
  onSave,
  initialAccount,
  environments,
  availableTags,
  onQuickCreateTag,
  defaultEnvironmentId,
}: AccountFormModalProps) {
  const { error } = useToast();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [environmentId, setEnvironmentId] = useState("");
  const [portal, setPortal] = useState<PortalType>("CP");
  const [role, setRole] = useState<string>("Employee");
  const [product, setProduct] = useState<ProductType>("Both");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [organization, setOrganization] = useState("");
  const [notes, setNotes] = useState("");

  const [newTagInput, setNewTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or populate form
  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name);
      setUsername(initialAccount.username);
      setPassword("");
      setEnvironmentId(initialAccount.environmentId);
      setPortal(initialAccount.portal);
      setRole(initialAccount.role);
      setProduct(initialAccount.product);
      setSelectedTags(initialAccount.tags || []);
      setOrganization(initialAccount.organization || "");
      setNotes(initialAccount.notes || "");
    } else {
      setName("");
      setUsername("");
      setPassword("");
      setEnvironmentId(defaultEnvironmentId || environments[0]?.id || "SIT1");
      setPortal("CP");
      setRole("Employee");
      setProduct("Both");
      setSelectedTags([]);
      setOrganization("");
      setNotes("");
    }
    setErrors({});
  }, [initialAccount, isOpen, defaultEnvironmentId, environments]);

  // Adjust role if portal changes
  const handlePortalChange = (newPortal: PortalType) => {
    setPortal(newPortal);
    if (newPortal === "CP") {
      setRole("Employee");
    } else {
      setRole("Admin");
    }
  };

  const handleToggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleAddNewTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTagInput.trim().replace(/^,+|,+$/g, "");
    if (!trimmed) return;
    try {
      // Check if tag already in availableTags
      const existing = availableTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        if (!selectedTags.includes(existing.name)) {
          setSelectedTags((prev) => [...prev, existing.name]);
        }
      } else {
        const created = await onQuickCreateTag(trimmed);
        if (!selectedTags.includes(created.name)) {
          setSelectedTags((prev) => [...prev, created.name]);
        }
      }
      setNewTagInput("");
    } catch (err: any) {
      error("Could not add tag", err?.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      environmentId,
      portal,
      username: username.trim(),
      password: password ? password.trim() : undefined,
      name: name.trim() || undefined,
      role: role || (portal === "WP" ? "Admin" : "Employee"),
      product: product || "Both",
      tags: selectedTags,
      organization: organization.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    // Zod validation
    const validation = accountFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue: any) => {
        const path = issue.path[0]?.toString() || "form";
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // New accounts must have a password
    if (!initialAccount && (!password || password.trim().length < 4)) {
      setErrors((prev) => ({
        ...prev,
        password: "Password is required (minimum 4 characters).",
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          id: initialAccount?.id,
          createdAt: initialAccount?.createdAt,
          name: formData.name || formData.username,
          username: formData.username,
          environmentId: formData.environmentId,
          portal: formData.portal,
          role: (portal === "WP" ? "Admin" : (formData.role || "Employee")) as any,
          product: formData.product,
          tags: formData.tags,
          organization: formData.organization,
          notes: formData.notes,
        },
        password.trim() || undefined
      );
      onClose();
    } catch (err: any) {
      error("Failed to save account", err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allowedRoles = portal === "CP" ? CP_ROLES : WP_ROLES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialAccount ? "Edit Test Account" : "Add Test Account"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure credentials, environment routing, and testing classification.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section: Required Account Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Required Credentials & Environment
              </h3>
              <span className="text-[10px] font-semibold text-rose-500">* Mandatory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Environment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={environmentId}
                  onChange={(e) => setEnvironmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {environments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name}
                    </option>
                  ))}
                </select>
                {errors.environmentId && (
                  <p className="text-xs text-rose-600 mt-1">{errors.environmentId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={portal}
                  onChange={(e) => handlePortalChange(e.target.value as PortalType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="CP">Consumer Portal (CP)</option>
                  <option value="WP">Worker Portal / Admin (WP)</option>
                </select>
                {errors.portal && (
                  <p className="text-xs text-rose-600 mt-1">{errors.portal}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username / Login ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. test.user"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                    errors.username ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                  }`}
                />
                {errors.username && (
                  <p className="text-xs text-rose-600 mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password{" "}
                    {initialAccount ? (
                      <span className="text-slate-400 font-normal">(Keep current)</span>
                    ) : (
                      <span className="text-rose-500">*</span>
                    )}
                  </label>
                  <span className="text-[10px] text-emerald-700 flex items-center">
                    <Shield className="w-2.5 h-2.5 mr-0.5" />
                    AES-256
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={initialAccount ? "••••••••••••" : "Enter password"}
                    className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                      errors.password ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Optional Details */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              2. Optional Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Display Name <span className="text-slate-400 font-normal">(Optional, defaults to username)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={username ? `Defaults to "${username}"` : "e.g. Jane Doe or Apex Admin"}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal Role <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {portal === "WP" ? (
                  <div className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-semibold flex items-center justify-between">
                    <span>Admin</span>
                    <span className="text-[10px] text-slate-400 font-medium">Locked for WP</span>
                  </div>
                ) : (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {CP_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supported Product <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value as ProductType)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {PRODUCTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Classification & Tags */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              3. Additional Tags & Notes (Optional)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Tags
              </label>

              {/* Tag Input Field */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                  placeholder="Type any tag and press Enter (e.g. AutoPayments)..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddNewTag()}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Assigned Tags Pills */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                  {selectedTags.map((tagName) => (
                    <span
                      key={tagName}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-white shadow-2xs"
                    >
                      <span>{tagName}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTag(tagName)}
                        className="hover:text-emerald-200 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Existing Reusable Tags Picker (if any exist) */}
              {availableTags.length > 0 && (
                <div className="mt-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Existing Tags (Click to select)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.name)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                            isSelected
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization / Related Account
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Acme Health Group"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scenario Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Primary for AutoPayments"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : initialAccount
                ? "Update Account"
                : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
