"use client";

import React, { useState, useEffect } from "react";
import { X, Tag as TagIcon, AlertTriangle } from "lucide-react";
import { Tag } from "@/types";
import { useToast } from "@/lib/toast-context";

interface TagFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onSave: (tag: Tag) => Promise<void>;
  onDelete?: (tag: Tag) => Promise<void>;
  accountUsageCount?: number;
}

export function TagFormModal({
  isOpen,
  onClose,
  tag,
  onSave,
  onDelete,
  accountUsageCount = 0,
}: TagFormModalProps) {
  const { error } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Tag["category"]>("Custom");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("emerald");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setCategory(tag.category);
      setDescription(tag.description || "");
      setColor(tag.color || "emerald");
    } else {
      setName("");
      setCategory("Custom");
      setDescription("");
      setColor("emerald");
    }
    setIsDeleting(false);
  }, [tag, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: tag?.id || `tag-${name.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`,
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        color,
        createdAt: tag?.createdAt || new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      error("Failed to save tag", err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tag || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(tag);
      onClose();
    } catch (err: any) {
      error("Failed to delete tag", err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <TagIcon className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              {tag ? "Edit Tag" : "Create New Tag"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDeleting ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Delete &ldquo;{tag?.name}&rdquo; tag?</p>
                <p className="mt-1 text-slate-600">
                  {accountUsageCount > 0 ? (
                    <>
                      This tag is currently assigned to{" "}
                      <strong>{accountUsageCount} account{accountUsageCount === 1 ? "" : "s"}</strong>.
                      Deleting it will permanently remove it from these accounts.
                    </>
                  ) : (
                    "This tag is not currently assigned to any accounts."
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                {isSubmitting ? "Deleting..." : "Confirm Deletion"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AutoPayments or EmployerLed"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Products">Products</option>
                <option value="Payments">Payments</option>
                <option value="Enrollment">Enrollment</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="When should test engineers use this tag?"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {tag && onDelete ? (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Delete Tag
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                >
                  {isSubmitting ? "Saving..." : tag ? "Save Changes" : "Create Tag"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
