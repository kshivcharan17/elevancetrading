"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, UserPlus, LogIn, Globe } from "lucide-react";

export default function AuthPage() {
  const { login, signup, loginWithGoogle, user } = useAuth();
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingEmail(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      // redirect handled by effect when `user` changes
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogle = async () => {
    if (!loginWithGoogle) return;
    setError(null);
    setLoadingGoogle(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign‑in failed");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <span className="text-2xl font-bold text-blue-500">
            ElevanceTrading
          </span>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">
          Practice trading with real‑time simulated data
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl grid md:grid-cols-2 gap-10 md:gap-16 items-center"
        >
          {/* Left marketing text */}
          <div className="hidden md:block">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl font-bold mb-4"
            >
              {isSignup
                ? "Create your free trading lab"
                : "Welcome back to your trading lab"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-gray-300 mb-6 text-sm"
            >
              Use a safe, simulated environment to learn how markets
              work. Practice strategies, track a mock portfolio, and
              explore multi‑asset charts — all without risking real
              money.
            </motion.p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Real‑time random market data
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Portfolio & P/L tracking on simulated trades
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Candlestick patterns & strategy testing
              </li>
            </ul>
          </div>

          {/* Right: auth card */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-700 relative overflow-hidden">
              <motion.div
                className="pointer-events-none absolute -right-16 -top-16 w-40 h-40 bg-blue-600 rounded-full opacity-20 blur-3xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.2 }}
                transition={{ duration: 0.8 }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {isSignup ? "Create account" : "Login"}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {isSignup
                      ? "Takes less than a minute"
                      : "Welcome back"}
                  </span>
                </div>

                {/* Google sign-in */}
                <button
                  type="button"
                  disabled={loadingGoogle || !loginWithGoogle}
                  onClick={handleGoogle}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm mb-4 border ${
                    loadingGoogle
                      ? "border-gray-600 bg-gray-800 text-gray-400"
                      : "border-gray-600 bg-gray-900 hover:bg-gray-800 text-gray-100"
                  }`}
                >
                  <Globe size={16} className="text-blue-400" />
                  {loadingGoogle
                    ? "Connecting..."
                    : isSignup
                    ? "Sign up with Google"
                    : "Continue with Google"}
                </button>

                <div className="flex items-center my-3">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="px-3 text-[11px] text-gray-500">
                    OR USE EMAIL
                  </span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Email/password form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs mb-1 text-gray-400">
                      Email
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus-within:border-blue-500">
                      <Mail size={14} className="text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="bg-transparent flex-1 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs mb-1 text-gray-400">
                      Password
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus-within:border-blue-500">
                      <Lock size={14} className="text-gray-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="At least 6 characters"
                        className="bg-transparent flex-1 text-sm outline-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-400 mt-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loadingEmail}
                    className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                      loadingEmail
                        ? "bg-blue-700 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } text-white transition-colors`}
                  >
                    {loadingEmail ? (
                      "Processing..."
                    ) : isSignup ? (
                      <>
                        <UserPlus size={14} />
                        Create account
                      </>
                    ) : (
                      <>
                        <LogIn size={14} />
                        Login
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignup((v) => !v);
                    setError(null);
                  }}
                  className="w-full mt-4 text-xs text-gray-300 hover:text-blue-400 transition-colors"
                >
                  {isSignup ? (
                    <>
                      Already have an account?{" "}
                      <span className="underline">Login</span>
                    </>
                  ) : (
                    <>
                      New here?{" "}
                      <span className="underline">
                        Create an account
                      </span>
                    </>
                  )}
                </button>

                <p className="mt-3 text-[10px] text-gray-500">
                  By continuing, you agree to use this platform for
                  educational and simulation purposes only. No real
                  funds are used or stored.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}