"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const { login, signup, user } = useAuth();
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      // no router.push here; the effect above will run when `user` changes
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: "40px auto" }}>
      <h1>{isSignup ? "Create account" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p style={{ color: "red", marginTop: 8 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          {loading
            ? "Loading..."
            : isSignup
            ? "Sign up"
            : "Login"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsSignup((v) => !v)}
        style={{ marginTop: 12 }}
      >
        {isSignup
          ? "Already have an account? Login"
          : "Need an account? Sign up"}
      </button>
    </main>
  );
}