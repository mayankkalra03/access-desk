"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Tag as TagIcon,
  Plus,
  Edit2,
  Trash2,
  Users,
  Search,
  ExternalLink,
} from "lucide-react";
import { useAppShell } from "@/components/layout/AppShell";
import { Tag } from "@/types";
import { TagFormModal } from "@/components/tags/TagFormModal";
import { dataService } from "@/lib/data-service";
import { useToast } from "@/lib/toast-context";

export default function TagsPage() {
  const { tags, accounts, refreshData } = useAppShell();
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Group tags by category
  const categories = ["Products", "Payments", "Enrollment", "Custom"];

  const filteredTags = tags.filter((t) => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = t.name.toLowerCase().includes(term);
      const matchDesc = t.description?.toLowerCase().includes(term);
      return matchName || matchDesc;
    }
    return true;
  });

  const getAccountCountForTag = (tagName: string) => {
    return accounts.filter((a) => a.tags.includes(tagName)).length;
  };

  const handleOpenCreate = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleSaveTag = async (tag: Tag) => {
    await dataService.saveTag(tag);
    success(editingTag ? "Tag updated" : "Tag created", tag.name);
    await refreshData();
  };

  const handleDeleteTag = async (tag: Tag) => {
    // Also remove tag from accounts that use it
    const affectedAccounts = accounts.filter((a) => a.tags.includes(tag.name));
    for (const acc of affectedAccounts) {
      const updatedTags = acc.tags.filter((t) => t !== tag.name);
      await dataService.saveAccount({ ...acc, tags: updatedTags });
    }

    await dataService.deleteTag(tag.id);
    success(
      "Tag removed",
      `Deleted "${tag.name}" and updated ${affectedAccounts.length} account${
        affectedAccounts.length === 1 ? "" : "s"
      }.`
    );
    await refreshData();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-700">Home</Link>
        <span>&rsaquo;</span>
        <span className="text-slate-800 font-medium">Tags</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tags & Taxonomy
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize test accounts by products, payment flows, and enrollment lifecycle scenarios.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Tag</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tags by name or scenario description..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags Grid / Empty State */}
      {filteredTags.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <TagIcon className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {searchTerm ? `No tags matching "${searchTerm}"` : "No tags created yet"}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You can create tags here, or simply type any custom tag when adding an account.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Tag</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags.map((tag) => {
          const usageCount = getAccountCountForTag(tag.name);

          return (
            <div
              key={tag.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <TagIcon className="w-3 h-3 mr-1.5 text-emerald-600" />
                    {tag.name}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(tag)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="Edit tag"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tag.category}
                  </span>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {tag.description || "Testing scenario tag"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {usageCount} account{usageCount === 1 ? "" : "s"}
                </span>

                <Link
                  href={`/accounts`}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center"
                >
                  <span>Filter Accounts</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Modal */}
      <TagFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tag={editingTag}
        onSave={handleSaveTag}
        onDelete={editingTag ? handleDeleteTag : undefined}
        accountUsageCount={editingTag ? getAccountCountForTag(editingTag.name) : 0}
      />
    </div>
  );
}
