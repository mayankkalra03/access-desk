"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Layers,
  Users,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      name: "Environments",
      href: "/environments",
      icon: Layers,
      isActive: pathname.startsWith("/environments"),
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: Users,
      isActive: pathname.startsWith("/accounts"),
    },
    {
      name: "Tags",
      href: "/tags",
      icon: Tag,
      isActive: pathname.startsWith("/tags"),
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 bg-white transition-all duration-300 z-30 select-none ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex items-center h-16 border-b border-slate-100 transition-all ${
          collapsed ? "justify-center px-0" : "justify-between px-4"
        }`}
      >
        <Link
          href="/"
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3 overflow-hidden"
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
            <svg
              width="20"
              height="20"
              style={{ width: "20px", height: "20px", maxWidth: "20px", maxHeight: "20px", display: "block" }}
              className="w-5 h-5 text-emerald-100"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
                AccessDesk
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-medium truncate">
                One place. Every environment.
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center py-2.5 rounded-md text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                item.isActive
                  ? "bg-emerald-50 text-emerald-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  item.isActive ? "text-emerald-700" : "text-slate-400"
                }`}
              />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle - Icon Only */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-center">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
