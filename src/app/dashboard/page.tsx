"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../../lib/userData";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await getWatchlist(user.uid);
      setSymbols(data);
      setLoadingWatchlist(false);
    };
    load();
  }, [user]);

  if (authLoading || !user) {
    return <p>Loading...</p>;
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    await addToWatchlist(user.uid, symbol);
    setSymbols((prev) =>
      prev.includes(symbol) ? prev : [...prev, symbol]
    );
    setNewSymbol("");
  };

  const handleRemove = async (symbol: string) => {
    await removeFromWatchlist(user.uid, symbol);
    setSymbols((prev) => prev.filter((s) => s !== symbol));
  };

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>

      <section style={{ marginTop: 24 }}>
        <h2>Your Watchlist</h2>
        {loadingWatchlist ? (
          <p>Loading watchlist...</p>
        ) : (
          <>
            <form onSubmit={handleAdd}>
              <input
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Symbol (e.g. AAPL)"
              />
              <button type="submit">Add</button>
            </form>

            {symbols.length === 0 ? (
              <p>No symbols yet.</p>
            ) : (
              <ul>
                {symbols.map((s) => (
                  <li key={s}>
                    {s}{" "}
                    <button onClick={() => handleRemove(s)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}