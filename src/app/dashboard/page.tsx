"use client";

import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  getWatchlist,
  setWatchlist,
  getPreferences,
  setPreferences,
  getPortfolio,
  setPortfolio,
  getIndicators,
  setIndicators,
  Watchlist,
  Preferences,
  Portfolio,
  Holding,
  IndicatorsState,
} from "../../lib/userData";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [watchlist, setWatchlistState] = useState<Watchlist>([]);
  const [newSymbol, setNewSymbol] = useState("");

  const [preferences, setPreferencesState] = useState<Preferences>({});
  const [portfolio, setPortfolioState] = useState<Portfolio>([]);
  const [indicators, setIndicatorsState] = useState<IndicatorsState>([]);

  const [loadingData, setLoadingData] = useState(true);

  // redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // load all user-specific data
  useEffect(() => {
    if (!user) return;

    const loadAll = async () => {
      const [wl, prefs, pf, inds] = await Promise.all([
        getWatchlist(user.uid),
        getPreferences(user.uid),
        getPortfolio(user.uid),
        getIndicators(user.uid),
      ]);

      setWatchlistState(wl);
      setPreferencesState(prefs);
      setPortfolioState(pf);
      setIndicatorsState(
        inds.length
          ? inds
          : [
              { id: "rsi", enabled: true },
              { id: "macd", enabled: false },
            ]
      );
      setLoadingData(false);
    };

    loadAll();
  }, [user]);

  if (authLoading || !user || loadingData) {
    return <p>Loading...</p>;
  }

  /* ---------- Watchlist handlers ---------- */

  const handleAddSymbol = async (e: FormEvent) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    const updated = watchlist.includes(symbol)
      ? watchlist
      : [...watchlist, symbol];
    setWatchlistState(updated);
    setNewSymbol("");
    await setWatchlist(user.uid, updated); // persist immediately
  };

  const handleRemoveSymbol = async (symbol: string) => {
    const updated = watchlist.filter((s) => s !== symbol);
    setWatchlistState(updated);
    await setWatchlist(user.uid, updated);
  };

  /* ---------- Preferences handlers ---------- */

  const handlePrefChange =
    (key: keyof Preferences) => async (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as any;
      const updated = { ...preferences, [key]: value };
      setPreferencesState(updated);
      await setPreferences(user.uid, updated);
    };

  /* ---------- Portfolio handlers ---------- */

  const [newHolding, setNewHolding] = useState({
    symbol: "",
    quantity: "",
    avgPrice: "",
  });

  const handleHoldingInputChange =
    (field: keyof typeof newHolding) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setNewHolding((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleAddHolding = async (e: FormEvent) => {
    e.preventDefault();
    const symbol = newHolding.symbol.trim().toUpperCase();
    const quantity = Number(newHolding.quantity);
    const avgPrice = Number(newHolding.avgPrice);

    if (!symbol || !quantity || !avgPrice) return;

    const holding: Holding = {
      id: Date.now().toString(),
      symbol,
      quantity,
      avgPrice,
    };

    const updated = [...portfolio, holding];
    setPortfolioState(updated);
    setNewHolding({ symbol: "", quantity: "", avgPrice: "" });
    await setPortfolio(user.uid, updated);
  };

  const handleRemoveHolding = async (id: string) => {
    const updated = portfolio.filter((h) => h.id !== id);
    setPortfolioState(updated);
    await setPortfolio(user.uid, updated);
  };

  /* ---------- Indicators handlers ---------- */

  const toggleIndicator = async (id: string) => {
    const updated = indicators.map((ind) =>
      ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
    );
    setIndicatorsState(updated);
    await setIndicators(user.uid, updated);
  };

  return (
    <main style={{ maxWidth: 900, margin: "40px auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {user.email}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      {/* ---------- Preferences ---------- */}
      <section style={{ marginTop: 24, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        <h2>Preferences</h2>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <label>Theme: </label>
            <select
              value={preferences.theme || "light"}
              onChange={handlePrefChange("theme")}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label>Default timeframe: </label>
            <select
              value={preferences.defaultTimeframe || "1D"}
              onChange={handlePrefChange("defaultTimeframe")}
            >
              <option value="1D">1D</option>
              <option value="1W">1W</option>
              <option value="1M">1M</option>
            </select>
          </div>
        </div>
      </section>

      {/* ---------- Watchlist ---------- */}
      <section style={{ marginTop: 24, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        <h2>Watchlist</h2>
        <form onSubmit={handleAddSymbol}>
          <input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Symbol (e.g. AAPL)"
          />
          <button type="submit">Add</button>
        </form>
        {watchlist.length === 0 ? (
          <p>No symbols yet.</p>
        ) : (
          <ul>
            {watchlist.map((s) => (
              <li key={s}>
                {s}{" "}
                <button onClick={() => handleRemoveSymbol(s)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Portfolio ---------- */}
      <section style={{ marginTop: 24, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        <h2>Portfolio Holdings</h2>
        <form onSubmit={handleAddHolding} style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Symbol"
            value={newHolding.symbol}
            onChange={handleHoldingInputChange("symbol")}
          />
          <input
            placeholder="Qty"
            type="number"
            value={newHolding.quantity}
            onChange={handleHoldingInputChange("quantity")}
          />
          <input
            placeholder="Avg Price"
            type="number"
            value={newHolding.avgPrice}
            onChange={handleHoldingInputChange("avgPrice")}
          />
          <button type="submit">Add trade</button>
        </form>

        {portfolio.length === 0 ? (
          <p>No holdings yet.</p>
        ) : (
          <table style={{ marginTop: 8, width: "100%" }}>
            <thead>
              <tr>
                <th align="left">Symbol</th>
                <th align="right">Qty</th>
                <th align="right">Avg Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((h) => (
                <tr key={h.id}>
                  <td>{h.symbol}</td>
                  <td align="right">{h.quantity}</td>
                  <td align="right">{h.avgPrice}</td>
                  <td>
                    <button onClick={() => handleRemoveHolding(h.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ---------- Indicators ---------- */}
      <section style={{ marginTop: 24, borderTop: "1px solid #ccc", paddingTop: 16 }}>
        <h2>Applied Indicators</h2>
        {indicators.length === 0 ? (
          <p>No indicators set.</p>
        ) : (
          <ul>
            {indicators.map((ind) => (
              <li key={ind.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={ind.enabled}
                    onChange={() => toggleIndicator(ind.id)}
                  />
                  {ind.id.toUpperCase()}
                </label>
              </li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: 12, color: "#666" }}>
          (Later you’ll connect these to your actual charting library.)
        </p>
      </section>
    </main>
  );
}