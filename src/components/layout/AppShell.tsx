"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GlobalSearchModal } from "@/components/common/GlobalSearchModal";
import { AccountDetailDrawer } from "@/components/accounts/AccountDetailDrawer";
import { EnvironmentDetailDrawer } from "@/components/environments/EnvironmentDetailDrawer";
import { AccountFormModal } from "@/components/accounts/AccountFormModal";
import { EnvironmentEditModal } from "@/components/environments/EnvironmentEditModal";
import { Account, AccountInput, Environment, Tag } from "@/types";
import { dataService } from "@/lib/data-service";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { SignInScreen } from "@/components/auth/SignInScreen";

export interface AppShellContextType {
  accounts: Account[];
  environments: Environment[];
  tags: Tag[];
  refreshData: () => Promise<void>;
  openAccountDetail: (account: Account) => void;
  openEnvironmentDetail: (env: Environment) => void;
  openAddAccount: (defaultEnvId?: string) => void;
  openEditAccount: (account: Account) => void;
  openDuplicateAccount: (account: Account) => void;
  openEditEnvironment: (env: Environment) => void;
  deleteAccount: (account: Account) => Promise<void>;
}

export const AppShellContext = React.createContext<AppShellContextType>({
  accounts: [],
  environments: [],
  tags: [],
  refreshData: async () => {},
  openAccountDetail: () => {},
  openEnvironmentDetail: () => {},
  openAddAccount: () => {},
  openEditAccount: () => {},
  openDuplicateAccount: () => {},
  openEditEnvironment: () => {},
  deleteAccount: async () => {},
});

export function useAppShell() {
  return React.useContext(AppShellContext);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading } = useAuth();
  const { success, error } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers state
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<Environment | null>(null);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [defaultEnvForNewAccount, setDefaultEnvForNewAccount] = useState<string | undefined>();

  const [envEditModalOpen, setEnvEditModalOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  const loadAllData = async () => {
    try {
      const [envs, accs, tgs] = await Promise.all([
        dataService.getEnvironments(),
        dataService.getAccounts(),
        dataService.getTags(),
      ]);
      setEnvironments(envs);
      setAccounts(accs);
      setTags(tgs);
    } catch (err: any) {
      console.error("Failed to load initial AccessDesk data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Global keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openAccountDetail = (account: Account) => {
    setSelectedAccount(account);
  };

  const openEnvironmentDetail = (env: Environment) => {
    setSelectedEnv(env);
  };

  const openAddAccount = (defaultEnvId?: string) => {
    setEditingAccount(null);
    setDefaultEnvForNewAccount(defaultEnvId);
    setAccountModalOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountModalOpen(true);
  };

  const openDuplicateAccount = (account: Account) => {
    // Duplicate metadata only, never copy password automatically
    setEditingAccount({
      ...account,
      id: "", // Blank id means new creation
      name: `${account.name} (Copy)`,
      username: `${account.username}_copy`,
    });
    setAccountModalOpen(true);
    success("Duplicated account metadata", "Please supply a new password for the copied account.");
  };

  const openEditEnvironment = (env: Environment) => {
    setEditingEnv(env);
    setEnvEditModalOpen(true);
  };

  const handleSaveAccount = async (
    accountData: AccountInput,
    password?: string
  ) => {
    const saved = await dataService.saveAccount(accountData, password);
    success(
      accountData.id ? "Account updated" : "Account created",
      `${saved.name} in ${saved.environmentId}`
    );
    await loadAllData();
    if (selectedAccount?.id === saved.id) {
      setSelectedAccount(saved);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete test account "${account.name}" (${account.username})?`)) {
      await dataService.deleteAccount(account.id);
      success("Account deleted", account.name);
      if (selectedAccount?.id === account.id) {
        setSelectedAccount(null);
      }
      await loadAllData();
    }
  };

  const handleSaveEnvironment = async (env: Environment) => {
    await dataService.updateEnvironment(env);
    success("Environment configured", `${env.name} settings updated.`);
    await loadAllData();
    if (selectedEnv?.id === env.id) {
      setSelectedEnv(env);
    }
  };

  const handleQuickCreateTag = async (tagName: string): Promise<Tag> => {
    const newTag: Tag = {
      id: `tag-${tagName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`,
      name: tagName,
      category: "Custom",
      color: "emerald",
      createdAt: new Date().toISOString(),
    };
    await dataService.saveTag(newTag);
    await loadAllData();
    success("Tag created", tagName);
    return newTag;
  };

  const activeAccountEnv = selectedAccount
    ? environments.find((e) => e.id === selectedAccount.environmentId)
    : undefined;

  return (
    <AppShellContext.Provider
      value={{
        accounts,
        environments,
        tags,
        refreshData: loadAllData,
        openAccountDetail,
        openEnvironmentDetail,
        openAddAccount,
        openEditAccount,
        openDuplicateAccount,
        openEditEnvironment,
        deleteAccount: handleDeleteAccount,
      }}
    >
      {authLoading ? (
        <div className="flex items-center justify-center h-screen w-screen bg-slate-50">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Checking authorization...</p>
          </div>
        </div>
      ) : !profile ? (
        <SignInScreen />
      ) : (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header
              onOpenSearch={() => setSearchOpen(true)}
            />

            <main className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">
                      Loading AccessDesk...
                    </p>
                  </div>
                </div>
              ) : (
                children
              )}
            </main>
          </div>

          {/* Global Search Command Palette */}
          <GlobalSearchModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            accounts={accounts}
            environments={environments}
            onSelectAccount={(acc) => {
              setSelectedAccount(acc);
            }}
            onSelectEnvironment={(env) => {
              setSelectedEnv(env);
            }}
          />

          {/* Account Detail Drawer */}
          <AccountDetailDrawer
            account={selectedAccount}
            environment={activeAccountEnv}
            onClose={() => setSelectedAccount(null)}
            onEdit={(acc) => openEditAccount(acc)}
            onDuplicate={(acc) => openDuplicateAccount(acc)}
            onDelete={(acc) => handleDeleteAccount(acc)}
          />

          {/* Environment Detail Drawer */}
          <EnvironmentDetailDrawer
            environment={selectedEnv}
            accounts={accounts}
            onClose={() => setSelectedEnv(null)}
            onEdit={(env) => openEditEnvironment(env)}
            onAddAccount={(envId) => openAddAccount(envId)}
            onSelectAccount={(acc) => setSelectedAccount(acc)}
          />

          {/* Account Add / Edit Modal */}
          <AccountFormModal
            isOpen={accountModalOpen}
            onClose={() => setAccountModalOpen(false)}
            onSave={handleSaveAccount}
            initialAccount={editingAccount}
            environments={environments}
            availableTags={tags}
            onQuickCreateTag={handleQuickCreateTag}
            defaultEnvironmentId={defaultEnvForNewAccount}
          />

          {/* Environment Edit Modal */}
          <EnvironmentEditModal
            isOpen={envEditModalOpen}
            onClose={() => setEnvEditModalOpen(false)}
            environment={editingEnv}
            onSave={handleSaveEnvironment}
          />
        </div>
      )}
    </AppShellContext.Provider>
  );
}
