"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, AlertCircle } from "lucide-react";
import { Environment, environmentFormSchema } from "@/types";
import { useToast } from "@/lib/toast-context";

interface EnvironmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  environment: Environment | null;
  onSave: (environment: Environment) => Promise<void>;
}

export function EnvironmentEditModal({
  isOpen,
  onClose,
  environment,
  onSave,
}: EnvironmentEditModalProps) {
  const { error } = useToast();
  const [name, setName] = useState("");
  const [cpUrl, setCpUrl] = useState("");
  const [wpUrl, setWpUrl] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (environment) {
      setName(environment.name);
      setCpUrl(environment.cpUrl || "");
      setWpUrl(environment.wpUrl || "");
      setDescription(environment.description || "");
      setStatus(environment.status);
      setIsFavorite(Boolean(environment.isFavorite));
    }
    setErrors({});
  }, [environment, isOpen]);

  if (!isOpen || !environment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData = {
      name: name.trim(),
      cpUrl: cpUrl.trim(),
      wpUrl: wpUrl.trim(),
      description: description.trim() || undefined,
      status,
      isFavorite,
    };

    const validation = environmentFormSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue: any) => {
        const path = issue.path[0]?.toString() || "form";
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...environment,
        name: formData.name,
        cpUrl: formData.cpUrl,
        wpUrl: formData.wpUrl,
        description: formData.description,
        status: formData.status,
        isFavorite: formData.isFavorite,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      error("Failed to update environment", err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Configure {environment.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set portal destinations, operational status, and environment metadata.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Environment Identifier / Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            {errors.name && (
              <p className="text-xs text-rose-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumer Portal (CP) URL
            </label>
            <input
              type="url"
              value={cpUrl}
              onChange={(e) => setCpUrl(e.target.value)}
              placeholder="https://cp.env.healthcare.com"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                errors.cpUrl ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
            />
            {errors.cpUrl && (
              <p className="text-xs text-rose-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.cpUrl}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Worker Portal / Admin Portal (WP) URL
            </label>
            <input
              type="url"
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
              placeholder="https://admin.env.healthcare.com"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                errors.wpUrl ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
            />
            {errors.wpUrl && (
              <p className="text-xs text-rose-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.wpUrl}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this environment..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="env-favorite"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="env-favorite" className="text-xs font-medium text-slate-700">
                Pin to Overview Favorites
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-700">Status:</span>
              <button
                type="button"
                onClick={() => setStatus(status === "active" ? "inactive" : "active")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  status === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {status === "active" ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
