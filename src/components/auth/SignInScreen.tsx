"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Lock,
  Mail,
  User,
  AtSign,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  Layers,
  Server,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Sign In dedicated state
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up dedicated state
  const [signUpName, setSignUpName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Switch tabs and reset dirty fields to avoid accidental cross-form prefill
  const handleSwitchMode = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setErrorMessage(null);
    setSignInIdentifier("");
    setSignInPassword("");
    setSignUpName("");
    setSignUpUsername("");
    setSignUpEmail("");
    setSignUpPassword("");
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await signIn(signInIdentifier, signInPassword);
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await signUp(signUpUsername, signUpEmail, signUpPassword, signUpName);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to create account. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-50 text-slate-900 font-sans select-none overflow-hidden">
      {/* Left Column: Visual Showcase (Hidden on small screens, 50% on lg+) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 bg-slate-100">
        {/* Background Image: Light-themed Architectural Technology Showcase */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/auth-hero-light.jpg"
            alt="AccessDesk Environment & Credential Operations"
            fill
            className="object-cover object-center scale-102"
            priority
          />
          {/* Seamless gradient fade: gently brightens text area while leaving artwork visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/40" />
        </div>

        {/* Top Header: Brand (Seamless, matching post-login sidebar) */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
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
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
                AccessDesk
              </span>
              <span className="text-[11px] text-slate-500 mt-1 font-medium">
                Environment & Credential Manager
              </span>
            </div>
          </div>
        </div>

        {/* Center: Hero Copy & Feature Cards (Clean, open layout without heavy opaque box) */}
        <div className="relative z-10 my-auto max-w-xl space-y-4 pr-6">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-900 text-xs font-semibold backdrop-blur-xs">
            <span>Secure Test Accounts</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            One place. <br />
            <span className="text-emerald-700">
              Every environment.
            </span>
          </h2>

          <p className="text-sm xl:text-base text-slate-700 leading-relaxed font-normal max-w-md">
            Manage portal routing, test accounts, and encrypted credentials across Consumer
            Portal (CP) and Worker Portal (WP) for DEV, SIT, TRN, UAT, and STG platforms.
          </p>

          {/* Value Pills / Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs">
              <Server className="w-4 h-4 text-emerald-700 mb-1" />
              <div className="text-xs font-bold text-slate-900">15 Envs</div>
              <div className="text-[10px] text-slate-500">DEV • SIT • UAT • STG</div>
            </div>

            <div className="p-3 rounded-xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs">
              <Layers className="w-4 h-4 text-emerald-700 mb-1" />
              <div className="text-xs font-bold text-slate-900">Dual Portals</div>
              <div className="text-[10px] text-slate-500">Consumer & Admin</div>
            </div>

            <div className="p-3 rounded-xl bg-white/75 backdrop-blur-md border border-white/80 shadow-xs">
              <KeyRound className="w-4 h-4 text-emerald-700 mb-1" />
              <div className="text-xs font-bold text-slate-900">AES-256-GCM</div>
              <div className="text-[10px] text-slate-500">Encrypted Credentials</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form (Light Theme) */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-center items-center px-6 sm:px-12 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile-only Branding */}
          <div className="lg:hidden flex items-center space-x-3 mb-2">
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
            <div className="flex flex-col">
              <span className="font-bold text-base text-slate-900 tracking-tight leading-none">
                AccessDesk
              </span>
              <span className="text-[11px] text-slate-500 mt-1 font-medium">
                Environment & Credential Manager
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {mode === "signin"
                ? "Enter your username and password to access platform environments."
                : "Register with a unique username to access and manage test accounts."}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleSwitchMode("signin")}
              className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                mode === "signin"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("signup")}
              className={`py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                mode === "signup"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          {mode === "signin" ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. your_username"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showSignInPassword ? "text" : "password"}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-2 cursor-pointer"
              >
                <span>{loading ? "Signing in..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Create Account Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Min. 3 chars</span>
                </div>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="e.g. alex_tech"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900 placeholder-slate-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="e.g. alex@company.com"
                    className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Min. 6 chars</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showSignUpPassword ? "text" : "password"}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 mt-2 cursor-pointer"
              >
                <span>{loading ? "Creating account..." : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Switch Mode Prompt */}
          <div className="text-center pt-2">
            {mode === "signin" ? (
              <p className="text-xs text-slate-500">
                New to AccessDesk?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signup")}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signin")}
                  className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
