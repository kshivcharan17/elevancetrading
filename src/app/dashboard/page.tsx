"use client";

import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import MultiAssetChart from "../../components/MultiAssetChart";
import type { StrategySignal } from "../../components/MultiAssetChart";
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
  Trade,
  getTrades,
  setTrades,
} from "../../lib/userData";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  ShoppingCart,
  User as UserIcon,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  BookOpen,
  Gift,
  HelpCircle,
  Settings,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

/* ---------- Header ---------- */

function Header({ isDark }: { isDark: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const notifications = 3;
  const router = useRouter();

  const headerClass = isDark
    ? "flex justify-between items-center p-4 bg-gray-900 text-white border-b border-gray-800"
    : "flex justify-between items-center p-4 bg-white text-gray-900 border-b border-gray-200";

  const inputClass = isDark
    ? "pl-10 pr-4 py-2 bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
    : "pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  const iconColor = isDark ? "text-gray-300" : "text-gray-600";
  const iconHover = isDark ? "hover:text-blue-500" : "hover:text-blue-600";

  const mobileMenuBg = isDark ? "bg-gray-800" : "bg-white";

  return (
    <motion.header {...fadeInUp} className={headerClass}>
      <div className="flex items-center space-x-8">
        <motion.span
          onClick={() => router.push("/")}
          className="text-2xl font-bold text-blue-500 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ElevanceTrading
        </motion.span>
        <nav className="hidden md:block">
          <ul className="flex space-x-4">
            <li>
              <a
                href="/"
                className="text-blue-500 font-semibold flex items-center"
              >
                <Zap className="mr-1" size={16} />
                Explore
              </a>
            </li>
            <li>
              <a
                href="/"
                className={`${iconColor} ${iconHover} transition-colors flex items-center`}
              >
                <Globe className="mr-1" size={16} />
                Investments
              </a>
            </li>
            <li>
              <a
                href="/"
                className={`${iconColor} ${iconHover} transition-colors flex items-center`}
              >
                <BookOpen className="mr-1" size={16} />
                Learn
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="What are you looking for today?"
            className={inputClass}
          />
        </div>
        <motion.div
          className="relative cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bell
            className={`${iconColor} ${iconHover} transition-colors`}
          />
          {notifications > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {notifications}
            </motion.span>
          )}
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <ShoppingCart
            className={`${iconColor} ${iconHover} cursor-pointer transition-colors`}
          />
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <UserIcon
            className={`${iconColor} ${iconHover} cursor-pointer transition-colors`}
          />
        </motion.div>
      </div>

      <div className="md:hidden">
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween" }}
            className={`fixed top-0 right-0 h-full w-64 ${mobileMenuBg} p-4 z-50`}
          >
            <motion.button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 right-4"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X />
            </motion.button>
            <nav className="mt-8">
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-blue-500 font-semibold flex items-center"
                  >
                    <Zap className="mr-2" size={16} />
                    Explore
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${iconColor} ${iconHover} transition-colors flex items-center`}
                  >
                    <Globe className="mr-2" size={16} />
                    Investments
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${iconColor} ${iconHover} transition-colors flex items-center`}
                  >
                    <BookOpen className="mr-2" size={16} />
                    Learn
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${iconColor} ${iconHover} transition-colors flex items-center`}
                  >
                    <Gift className="mr-2" size={16} />
                    Rewards
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${iconColor} ${iconHover} transition-colors flex items-center`}
                  >
                    <HelpCircle className="mr-2" size={16} />
                    Support
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={`${iconColor} ${iconHover} transition-colors flex items-center`}
                  >
                    <Settings className="mr-2" size={16} />
                    Settings
                  </a>
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ---------- Helpers ---------- */

function generateRandomChange(value: number) {
  const change = (Math.random() * 2 - 1) * 100;
  const percentChange = (change / value) * 100;
  return { change, percentChange };
}

/* ---------- Dashboard page with Firebase data ---------- */

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [watchlist, setWatchlistState] = useState<Watchlist>([]);
  const [preferences, setPreferencesState] = useState<Preferences>({});
  const [portfolio, setPortfolioState] = useState<Portfolio>([]);
  const [indicators, setIndicatorsState] = useState<IndicatorsState>([]);
  const [loadingData, setLoadingData] = useState(true);

  // simulated market prices
  const [prices, setPrices] = useState<Record<string, number>>({
    AAPL: 180,
    BND: 100,
    BTC: 50000,
    RELIANCE: 2500,
    TCS: 3500,
    HDFCBANK: 1600,
    INFY: 1500,
  });

  // trade history
  const [trades, setTradesState] = useState<Trade[]>([]);

  // redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // simulate market prices
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const next: Record<string, number> = {};
        for (const sym of Object.keys(prev)) {
          const prevPrice = prev[sym];
          const change = (Math.random() * 2 - 1) * (prevPrice * 0.003); // ±0.3%
          next[sym] = Math.max(1, prevPrice + change);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // load all user-specific data
  useEffect(() => {
    if (!user) return;
    const loadAll = async () => {
      const [wl, prefs, pf, inds, tr] = await Promise.all([
        getWatchlist(user.uid),
        getPreferences(user.uid),
        getPortfolio(user.uid),
        getIndicators(user.uid),
        getTrades(user.uid),
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
      setTradesState(tr);
      setLoadingData(false);
    };

    loadAll();
  }, [user]);

  if (authLoading || !user || loadingData) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-gray-200">
        Loading...
      </div>
    );
  }

  const isDark = (preferences.theme || "dark") === "dark";

  /* ---------- Preferences handlers ---------- */

  const handlePrefChange =
    (key: keyof Preferences) =>
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as any;
      const updated = { ...preferences, [key]: value };
      setPreferencesState(updated);
      await setPreferences(user.uid, updated);
    };

  const handleStrategySignal = async (signal: StrategySignal) => {
    const price = prices[signal.assetId] ?? signal.price;
    await handleOrder({
      side: signal.side,
      symbol: signal.assetId,
      price,
      quantity: 1, // could be rule.size in the future
    });
  };

  /* ---------- Watchlist handlers ---------- */

  const handleToggleWatchlist = async (symbol: string) => {
    const upper = symbol.toUpperCase();
    let updated: string[];
    if (watchlist.includes(upper)) {
      updated = watchlist.filter((s) => s !== upper);
    } else {
      updated = [...watchlist, upper];
    }
    setWatchlistState(updated);
    await setWatchlist(user.uid, updated);
  };

  /* ---------- Portfolio order handler (simulation) ---------- */

  const handleOrder = async (order: {
    side: "BUY" | "SELL";
    symbol: string;
    price: number;
    quantity: number;
  }) => {
    const sym = order.symbol.toUpperCase();
    const notional = order.price * order.quantity;
    const feeRate = 0.001; // 0.1%
    const fee = notional * feeRate;

    let updatedHoldings = [...portfolio];
    let updatedTrades = [...trades];
    const existing = updatedHoldings.find((h) => h.symbol === sym);

    if (order.side === "BUY") {
      if (existing) {
        const totalQty = existing.quantity + order.quantity;
        const totalCost =
          existing.avgPrice * existing.quantity +
          order.price * order.quantity +
          fee; // fee increases cost basis

        const newAvg = totalCost / totalQty;

        updatedHoldings = updatedHoldings.map((h) =>
          h.symbol === sym
            ? {
                ...h,
                quantity: totalQty,
                avgPrice: newAvg,
                realizedPnl: h.realizedPnl ?? 0,
              }
            : h
        );
      } else {
        updatedHoldings.push({
          id: Date.now().toString(),
          symbol: sym,
          quantity: order.quantity,
          avgPrice: order.price + fee / order.quantity, // spread fee into avgPrice
          realizedPnl: 0,
        });
      }

      updatedTrades.unshift({
        id: `${Date.now()}-${Math.random()}`,
        symbol: sym,
        side: "BUY",
        quantity: order.quantity,
        price: order.price,
        fee,
        realizedPnl: 0,
        timestamp: Date.now(),
      });
    } else {
      // SELL
      if (!existing || existing.quantity < order.quantity) {
        alert("Not enough quantity to sell");
        return;
      }

      const sellQty = order.quantity;
      const remainingQty = existing.quantity - sellQty;

      const grossRealized =
        (order.price - existing.avgPrice) * sellQty;
      const realizedAfterFee = grossRealized - fee;

      const updatedRealized =
        (existing.realizedPnl ?? 0) + realizedAfterFee;

      if (remainingQty === 0) {
        updatedHoldings = updatedHoldings.filter(
          (h) => h.symbol !== sym
        );
      } else {
        updatedHoldings = updatedHoldings.map((h) =>
          h.symbol === sym
            ? {
                ...h,
                quantity: remainingQty,
                realizedPnl: updatedRealized,
              }
            : h
        );
      }

      updatedTrades.unshift({
        id: `${Date.now()}-${Math.random()}`,
        symbol: sym,
        side: "SELL",
        quantity: sellQty,
        price: order.price,
        fee,
        realizedPnl: realizedAfterFee,
        timestamp: Date.now(),
      });
    }

    setPortfolioState(updatedHoldings);
    setTradesState(updatedTrades);

    await Promise.all([
      setPortfolio(user.uid, updatedHoldings),
      setTrades(user.uid, updatedTrades),
    ]);
  };

  /* ---------- Indicators handlers ---------- */

  const toggleIndicator = async (id: string) => {
    const updated = indicators.map((ind) =>
      ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
    );
    setIndicatorsState(updated);
    await setIndicators(user.uid, updated);
  };

  /* ---------- Derived portfolio metrics ---------- */

  const holdingsWithMetrics = portfolio.map((h) => {
    const price = prices[h.symbol] ?? h.avgPrice;
    const currentValue = price * h.quantity;
    const costBasis = h.avgPrice * h.quantity;
    const unrealized = currentValue - costBasis;
    const realized = h.realizedPnl ?? 0;
    return {
      ...h,
      price,
      currentValue,
      costBasis,
      unrealized,
      realized,
    };
  });

  const totalValue = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.currentValue,
    0
  );
  const totalCost = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.costBasis,
    0
  );
  const totalUnrealized = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.unrealized,
    0
  );
  const totalRealized = holdingsWithMetrics.reduce(
    (sum, h) => sum + h.realized,
    0
  );

  const allocation = holdingsWithMetrics.map((h) => ({
    symbol: h.symbol,
    weight: totalValue > 0 ? (h.currentValue / totalValue) * 100 : 0,
  }));

  /* ---------- theme-dependent classes ---------- */

  const appBg = isDark
    ? "bg-gray-900 min-h-screen text-gray-300"
    : "bg-gray-100 min-h-screen text-gray-900";

  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const cardInnerBg = isDark ? "bg-gray-900" : "bg-gray-100";
  const headingText = isDark ? "text-white" : "text-gray-900";
  const subText = isDark ? "text-gray-400" : "text-gray-600";

  return (
    <div className={appBg}>
      <Header isDark={isDark} />

      <main className="container mx-auto px-4 py-4 space-y-8">
        {/* Top bar */}
        <motion.section
          {...fadeInUp}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className={`text-2xl font-semibold ${headingText}`}>
              Welcome, {user.email}
            </h1>
            <p className={`${subText} text-sm`}>
              Your personalized ElevanceTrading dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm">
              <div>
                <label className={`${subText} text-xs mb-1 block`}>
                  Theme
                </label>
                <select
                  value={preferences.theme || "dark"}
                  onChange={handlePrefChange("theme")}
                  className={
                    isDark
                      ? "bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                      : "bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className={`${subText} text-xs mb-1 block`}>
                  Default timeframe
                </label>
                <select
                  value={preferences.defaultTimeframe || "1D"}
                  onChange={handlePrefChange("defaultTimeframe")}
                  className={
                    isDark
                      ? "bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                      : "bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                  }
                >
                  <option value="1D">1D</option>
                  <option value="1W">1W</option>
                  <option value="1M">1M</option>
                </select>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full"
            >
              Logout
            </button>
          </div>
        </motion.section>

        {/* Multi-asset chart */}
        <section className={`${cardBg} rounded-lg p-4 shadow-md`}>
          <MultiAssetChart
            isDark={isDark}
            uid={user.uid}
            onStrategySignal={handleStrategySignal}
          />
        </section>

        {/* Main grid */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Watchlist */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className={`text-lg font-semibold ${headingText}`}>
                  Your Watchlist
                </h2>
                <span className={`text-xs ${subText}`}>
                  Click star on cards to add / remove
                </span>
              </div>

              {watchlist.length === 0 ? (
                <p className={`${subText} text-sm`}>
                  You don&apos;t have any symbols yet. Add some using the
                  portfolio order panel or explore sections.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {watchlist.map((sym) => (
                    <WatchlistCard
                      key={sym}
                      symbol={sym}
                      onToggle={() => handleToggleWatchlist(sym)}
                      isDark={isDark}
                    />
                  ))}
                </div>
              )}
            </motion.div>

            {/* Top by market cap */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className={`text-lg font-semibold ${headingText}`}>
                  Top by Market Cap
                </h2>
                <span className="text-xs text-blue-500 cursor-pointer">
                  View all
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {["RELIANCE", "TCS", "HDFCBANK", "INFY"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-full flex justify-between items-center ${cardInnerBg} hover:opacity-90 rounded px-3 py-2`}
                    onClick={() => handleToggleWatchlist(c)}
                  >
                    <span className={headingText}>{c}</span>
                    <span
                      className={`text-xs ${subText} flex items-center gap-2`}
                    >
                      <TrendingUp size={14} /> Add / Remove watch
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Asset Allocation */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <h2 className={`text-lg font-semibold mb-3 ${headingText}`}>
                Asset Allocation
              </h2>
              {allocation.length === 0 ? (
                <p className={`${subText} text-sm`}>
                  No holdings yet. Allocation will appear once you buy assets.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {allocation.map((a) => (
                    <div key={a.symbol}>
                      <div className="flex justify-between mb-1">
                        <span className={headingText}>{a.symbol}</span>
                        <span className={subText}>
                          {a.weight.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
                        <div
                          className="h-2 bg-blue-500"
                          style={{ width: `${a.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Portfolio Summary */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <h2 className={`text-lg font-semibold mb-3 ${headingText}`}>
                Portfolio Summary
              </h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={subText}>Total Value</span>
                  <span className={headingText}>
                    ₹{totalValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={subText}>Total Cost</span>
                  <span className={headingText}>
                    ₹{totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={subText}>Unrealized P/L</span>
                  <span
                    className={
                      totalUnrealized >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    ₹{totalUnrealized.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={subText}>Realized P/L</span>
                  <span
                    className={
                      totalRealized >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    ₹{totalRealized.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Place Order */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <h2 className={`text-lg font-semibold mb-3 ${headingText}`}>
                Place Order
              </h2>
              <OrderPanel
                isDark={isDark}
                onSubmit={async (order) => {
                  await handleOrder(order);
                  handleToggleWatchlist(order.symbol);
                }}
              />
            </motion.div>

            {/* Holdings */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <h2 className={`text-lg font-semibold mb-3 ${headingText}`}>
                Your Holdings
              </h2>
              {holdingsWithMetrics.length === 0 ? (
                <p className={`${subText} text-sm`}>
                  No holdings yet. Place a buy order to get started.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr
                        className={
                          isDark
                            ? "text-gray-400 border-b border-gray-700"
                            : "text-gray-500 border-b border-gray-200"
                        }
                      >
                        <th className="text-left py-2">Symbol</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Avg Price</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Value</th>
                        <th className="text-right py-2">Unrealized P/L</th>
                        <th className="text-right py-2">Realized P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsWithMetrics.map((h) => (
                        <tr
                          key={h.id}
                          className={
                            isDark
                              ? "border-b border-gray-900"
                              : "border-b border-gray-100"
                          }
                        >
                          <td className="py-2">{h.symbol}</td>
                          <td className="py-2 text-right">{h.quantity}</td>
                          <td className="py-2 text-right">
                            ₹{h.avgPrice.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            ₹{h.price.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            ₹{h.currentValue.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={
                                h.unrealized >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              ₹{h.unrealized.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={
                                h.realized >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              ₹{h.realized.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Indicators */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <h2 className={`text-lg font-semibold mb-3 ${headingText}`}>
                Chart Indicators
              </h2>
              {indicators.length === 0 ? (
                <p className={`${subText} text-sm`}>
                  No indicators set. This will control what appears on your
                  charts.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  {indicators.map((ind) => (
                    <label
                      key={ind.id}
                      className="flex items-center justify-between"
                    >
                      <span>{ind.id.toUpperCase()}</span>
                      <input
                        type="checkbox"
                        checked={ind.enabled}
                        onChange={() => toggleIndicator(ind.id)}
                      />
                    </label>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-500 mt-2">
                Later you&apos;ll hook this to your actual charting library.
              </p>
            </motion.div>

            {/* Trade History */}
            <motion.div
              {...fadeInUp}
              className={`${cardBg} rounded-lg p-4 shadow-md`}
            >
              <h2 className={`text-lg font-semibold mb-3 ${headingText}`}>
                Trade History
              </h2>
              {trades.length === 0 ? (
                <p className={`${subText} text-sm`}>
                  No trades yet. Place buy/sell orders to build history.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto text-xs">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={
                          isDark
                            ? "text-gray-400 border-b border-gray-700"
                            : "text-gray-500 border-b border-gray-200"
                        }
                      >
                        <th className="text-left py-1">Time</th>
                        <th className="text-left py-1">Symbol</th>
                        <th className="text-left py-1">Side</th>
                        <th className="text-right py-1">Qty</th>
                        <th className="text-right py-1">Price</th>
                        <th className="text-right py-1">Fee</th>
                        <th className="text-right py-1">Realized P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t) => (
                        <tr key={t.id}>
                          <td className="py-1">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-1">{t.symbol}</td>
                          <td
                            className={
                              t.side === "BUY"
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {t.side}
                          </td>
                          <td className="py-1 text-right">
                            {t.quantity}
                          </td>
                          <td className="py-1 text-right">
                            ₹{t.price.toFixed(2)}
                          </td>
                          <td className="py-1 text-right">
                            ₹{t.fee.toFixed(2)}
                          </td>
                          <td className="py-1 text-right">
                            <span
                              className={
                                t.realizedPnl >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }
                            >
                              ₹{t.realizedPnl.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- Small components ---------- */

type OrderSide = "BUY" | "SELL";
type Order = {
  side: OrderSide;
  symbol: string;
  price: number;
  quantity: number;
};

function mockGetCurrentPrice(symbol: string): number {
  if (!symbol) return 0;
  const base = symbol.charCodeAt(0) * 2;
  return Math.round((base + 100 + Math.random() * 20) * 100) / 100;
}

function OrderPanel({
  onSubmit,
  isDark,
}: {
  onSubmit: (order: Order) => Promise<void>;
  isDark: boolean;
}) {
  const [side, setSide] = useState<OrderSide>("BUY");
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSymbolBlur = () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    const p = mockGetCurrentPrice(sym);
    setPrice(p);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sym = symbol.trim().toUpperCase();
    const qty = Number(quantity);
    if (!sym || !qty || !price) return;

    setLoading(true);
    try {
      await onSubmit({ side, symbol: sym, price, quantity: qty });
      setQuantity("");
    } finally {
      setLoading(false);
    }
  };

  const panelBg = isDark ? "bg-gray-900" : "bg-gray-100";
  const inputBg = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-300";
  const textMuted = isDark ? "text-gray-400" : "text-gray-600";
  const textNormal = isDark ? "text-gray-200" : "text-gray-800";

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-3 text-xs ${panelBg} rounded-lg p-3`}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide("BUY")}
          className={`flex-1 py-1 rounded-full border ${
            side === "BUY"
              ? "bg-green-500 border-green-500 text-white"
              : `border-gray-500 ${textNormal}`
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          className={`flex-1 py-1 rounded-full border ${
            side === "SELL"
              ? "bg-red-500 border-red-500 text-white"
              : `border-gray-500 ${textNormal}`
          }`}
        >
          Sell
        </button>
      </div>

      <div>
        <label className={`block mb-1 ${textMuted}`}>Symbol</label>
        <input
          className={`w-full rounded px-2 py-1 border ${inputBg} ${textNormal}`}
          placeholder="e.g. RELIANCE"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onBlur={handleSymbolBlur}
        />
      </div>

      <div>
        <label className={`block mb-1 ${textMuted}`}>Price</label>
        <input
          type="number"
          className={`w-full rounded px-2 py-1 border ${inputBg} ${textNormal}`}
          value={price || ""}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>

      <div>
        <label className={`block mb-1 ${textMuted}`}>Quantity</label>
        <input
          type="number"
          className={`w-full rounded px-2 py-1 border ${inputBg} ${textNormal}`}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`mt-1 py-1.5 rounded-full text-white ${
          side === "BUY"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        } disabled:opacity-60`}
      >
        {loading ? "Placing..." : side === "BUY" ? "Buy" : "Sell"}
      </button>
    </form>
  );
}

function WatchlistCard({
  symbol,
  onToggle,
  isDark,
}: {
  symbol: string;
  onToggle: () => void;
  isDark: boolean;
}) {
  const [price, setPrice] = useState(100);
  const [change, setChange] = useState(0);
  const [percentChange, setPercentChange] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice((prev) => {
        const { change: c, percentChange: pc } = generateRandomChange(prev);
        setChange(c);
        setPercentChange(pc);
        return prev + c;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cardBg = isDark ? "bg-gray-900" : "bg-white";
  const textMain = isDark ? "text-white" : "text-gray-900";

  return (
    <motion.div
      className={`${cardBg} p-3 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer relative`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => router.push(`/dashboard/${symbol}`)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="absolute top-2 right-2 text-yellow-400 text-lg"
      >
        ★
      </button>

      <h3 className={`font-semibold mb-1 text-sm ${textMain}`}>{symbol}</h3>
      <div className="flex items-center justify-between">
        <span className={`text-sm ${textMain}`}>
          {price.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </span>
        <motion.span
          key={change}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-[11px] flex items-center ${
            change >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          {change >= 0 ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {change.toFixed(2)} ({percentChange.toFixed(2)}%)
        </motion.span>
      </div>
    </motion.div>
  );
}