"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Layer,
  Customized,
} from "recharts";
import {
  getMultiAssetConfig,
  setMultiAssetConfig,
  AssetChartConfig,
} from "../lib/userData";

type ChartType = "line" | "bar" | "candlestick";

type AssetConfig = {
  id: string;
  name: string;
  type: ChartType;
  visible: boolean;
  color: string;
};

type DataPoint = {
  time: string;
  [key: string]: any;
};

const ASSETS_INITIAL: AssetConfig[] = [
  {
    id: "AAPL",
    name: "Apple (Stock)",
    type: "line",
    visible: true,
    color: "#4F46E5",
  },
  {
    id: "BND",
    name: "Bond ETF",
    type: "bar",
    visible: true,
    color: "#10B981",
  },
  {
    id: "BTC",
    name: "Bitcoin (Crypto)",
    type: "candlestick",
    visible: true,
    color: "#F59E0B",
  },
];

// --- random walk helpers ---

function randomStep(prev: number): number {
  const change = (Math.random() * 2 - 1) * (prev * 0.005);
  return Math.max(1, prev + change);
}

function makeCandle(prevClose: number) {
  const close = randomStep(prevClose);
  const high =
    Math.max(close, prevClose) + Math.random() * (prevClose * 0.003);
  const low =
    Math.min(close, prevClose) - Math.random() * (prevClose * 0.003);
  const open = prevClose;
  return { open, high, low, close };
}

/* ---------- Custom candlestick shape ---------- */

type CandleProps = {
  x?: number;
  y?: number;
  width?: number;
  payload?: any;
  dataKey: string;
  color: string;
};

function CandleShape(props: CandleProps) {
  const { x = 0, width = 8, payload, dataKey, color } = props;
  if (!payload || !payload[dataKey]) return null;

  const { open, close } = payload[dataKey];
  const isUp = close >= open;
  const fill = isUp ? "#16A34A" : "#DC2626";

  const bodyHeight = 16;
  const centerY = (props.y ?? 0) + 10;
  const topBody = centerY - bodyHeight / 2;
  const candleX = x + width / 2;

  return (
    <Layer>
      <line
        x1={candleX}
        x2={candleX}
        y1={topBody - 8}
        y2={topBody + bodyHeight + 8}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x}
        y={topBody}
        width={width}
        height={bodyHeight}
        fill={fill}
        stroke={color}
      />
    </Layer>
  );
}

/* ---------- Pattern detection ---------- */

type PatternType = "hammer" | "doji" | "bullish_engulfing";

type PatternHit = {
  index: number;
  assetId: string;
  type: PatternType;
};

function isDoji(candle: any): boolean {
  const { open, close, high, low } = candle;
  const range = high - low;
  if (range === 0) return false;
  const body = Math.abs(close - open);
  return body <= range * 0.1;
}

function isHammer(candle: any): boolean {
  const { open, close, high, low } = candle;
  const body = Math.abs(close - open);
  const range = high - low;
  if (range === 0) return false;

  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;

  const bodyRatio = body / range;
  return (
    bodyRatio <= 0.3 &&
    lowerWick >= body * 2 &&
    upperWick <= body
  );
}

function isBullishEngulfing(prev: any, curr: any): boolean {
  const { open: o1, close: c1 } = prev;
  const { open: o2, close: c2 } = curr;
  if (!(c1 < o1 && c2 > o2)) return false;
  return o2 < c1 && c2 > o1;
}

/* ---------- Indicators & strategy ---------- */

type IndicatorValues = {
  sma20?: number;
  rsi14?: number;
  vol20?: number; // 20‑period volatility
};

type IndicatorState = Record<string, IndicatorValues>;

type StrategyRuleType = "price_cross_sma20_up" | "rsi_overbought";

type StrategyRule = {
  assetId: string;
  type: StrategyRuleType;
  enabled: boolean;
  size: number;
  // simple params for customization
  rsiThreshold?: number; // used for rsi_overbought
};

export type StrategySignal = {
  assetId: string;
  side: "BUY" | "SELL";
  ruleType: StrategyRuleType;
  price: number;
  time: string;
};

/* ---------- Indicator helpers ---------- */

function calcSMA(values: number[], period: number): (number | undefined)[] {
  const res: (number | undefined)[] = new Array(values.length).fill(
    undefined
  );
  if (values.length < period) return res;

  let sum = 0;

  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      res[i] = sum / period;
    }
  }

  return res;
}

// Wilder's RSI(14)
function calcRSI(values: number[], period = 14): (number | undefined)[] {
  const res: (number | undefined)[] = new Array(values.length).fill(
    undefined
  );
  if (values.length < period + 1) return res;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    gainSum += gain;
    lossSum += loss;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  const firstIndex = period;
  {
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    res[firstIndex] = rsi;
  }

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    res[i] = rsi;
  }

  return res;
}

// rolling volatility of returns
function calcVolatility(
  values: number[],
  period: number
): (number | undefined)[] {
  const res: (number | undefined)[] = new Array(values.length).fill(
    undefined
  );
  if (values.length < period + 1) return res;

  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const r = prev === 0 ? 0 : (curr - prev) / prev;
    returns.push(r);
  }

  for (let i = period - 1; i < returns.length; i++) {
    const window = returns.slice(i - period + 1, i + 1);
    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    const variance =
      window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);

    const dataIndex = i + 1;
    res[dataIndex] = std;
  }

  return res;
}

/* ---------- Component ---------- */

export default function MultiAssetChart({
  isDark,
  uid,
  onStrategySignal,
  enabledIndicators = [],
}: {
  isDark: boolean;
  uid: string;
  onStrategySignal?: (signal: StrategySignal) => void;
  // provided by DashboardPage based on user toggles: ["sma", "rsi", "vol"]
  enabledIndicators?: string[];
}) {
  const [assets, setAssets] = useState<AssetConfig[]>(ASSETS_INITIAL);
  const [data, setData] = useState<DataPoint[]>([]);
  const [lastValues, setLastValues] = useState<Record<string, number>>({
    AAPL: 180,
    BND: 100,
    BTC: 50000,
  });

  const [loaded, setLoaded] = useState(false);

  const [patterns, setPatterns] = useState<PatternHit[]>([]);
  const [patternFilter, setPatternFilter] = useState<{
    hammer: boolean;
    doji: boolean;
    bullish_engulfing: boolean;
  }>({
    hammer: true,
    doji: true,
    bullish_engulfing: true,
  });

  const [indicators, setIndicators] = useState<IndicatorState>({});
  const [prevCrossState, setPrevCrossState] = useState<
    Record<string, boolean | undefined>
  >({});

  // adjustable chart time window (number of points)
  const [windowSize, setWindowSize] = useState<number>(60);

  // default strategy rules (now customizable)
  const defaultRules: StrategyRule[] = ASSETS_INITIAL.flatMap((a) => [
    {
      assetId: a.id,
      type: "price_cross_sma20_up",
      enabled: true,
      size: 1,
    },
    {
      assetId: a.id,
      type: "rsi_overbought",
      enabled: true,
      size: 1,
      rsiThreshold: 70,
    },
  ]);
  const [strategyRules, setStrategyRules] =
    useState<StrategyRule[]>(defaultRules);

  // load saved asset config
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const saved = await getMultiAssetConfig(uid);
        if (saved && saved.length) {
          setAssets((current) =>
            current.map((a) => {
              const found = saved.find((s) => s.id === a.id);
              return found
                ? { ...a, type: found.type, visible: found.visible }
                : a;
            })
          );
        }
      } catch (e) {
        console.error("Failed to load multiAsset config", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [uid]);

  // init + live random data
  useEffect(() => {
    let current = { ...lastValues };

    const initialData: DataPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const time = new Date(Date.now() - (30 - i) * 1000)
        .toTimeString()
        .slice(0, 8);
      const dp: DataPoint = { time };

      for (const asset of ASSETS_INITIAL) {
        if (asset.id === "BTC") {
          const candle = makeCandle(current[asset.id] ?? 50000);
          current[asset.id] = candle.close;
          dp[asset.id] = candle;
        } else {
          const next = randomStep(current[asset.id] ?? 100);
          current[asset.id] = next;
          dp[asset.id] = { close: Number(next.toFixed(2)) };
        }
      }

      initialData.push(dp);
    }

    setData(initialData);
    setLastValues(current);

    const interval = setInterval(() => {
      setData((prev) => {
        const time = new Date().toTimeString().slice(0, 8);
        const dp: DataPoint = { time };
        const nextLast = { ...current };

        for (const asset of ASSETS_INITIAL) {
          if (asset.id === "BTC") {
            const candle = makeCandle(nextLast[asset.id] ?? 50000);
            nextLast[asset.id] = candle.close;
            dp[asset.id] = candle;
          } else {
            const next = randomStep(nextLast[asset.id] ?? 100);
            nextLast[asset.id] = next;
            dp[asset.id] = { close: Number(next.toFixed(2)) };
          }
        }

        current = nextLast;
        setLastValues(nextLast);

        const nextData = [...prev, dp];
        if (nextData.length > windowSize) nextData.shift();
        return nextData;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  // detect patterns for BTC
  useEffect(() => {
    const hits: PatternHit[] = [];
    for (let i = 0; i < data.length; i++) {
      const dp = data[i];
      const candle = dp["BTC"];
      if (!candle || typeof candle !== "object") continue;

      if (isDoji(candle)) {
        hits.push({ index: i, assetId: "BTC", type: "doji" });
      } else if (isHammer(candle)) {
        hits.push({ index: i, assetId: "BTC", type: "hammer" });
      }

      if (i > 0) {
        const prev = data[i - 1]["BTC"];
        if (prev && isBullishEngulfing(prev, candle)) {
          hits.push({
            index: i,
            assetId: "BTC",
            type: "bullish_engulfing",
          });
        }
      }
    }
    setPatterns(hits);
  }, [data]);

  // compute indicators + evaluate strategies
  useEffect(() => {
    const newIndicators: IndicatorState = {};

    for (const asset of ASSETS_INITIAL) {
      const closes = data.map((dp) => {
        const v = dp[asset.id];
        if (!v) return 0;
        if (typeof v === "number") return v;
        if (typeof v === "object" && "close" in v) return v.close as number;
        return 0;
      });

      const smaArr = calcSMA(closes, 20);
      const rsiArr = calcRSI(closes, 14);
      const volArr = calcVolatility(closes, 20);

      const lastIdx = data.length - 1;
      if (lastIdx >= 0) {
        newIndicators[asset.id] = {
          sma20: smaArr[lastIdx],
          rsi14: rsiArr[lastIdx],
          vol20: volArr[lastIdx],
        };
      }
    }

    setIndicators(newIndicators);

    const lastIndex = data.length - 1;
    if (lastIndex < 1) return;

    const latestDp = data[lastIndex];
    const prevDp = data[lastIndex - 1];

    const nextCrossState: typeof prevCrossState = { ...prevCrossState };

    for (const rule of strategyRules) {
      if (!rule.enabled) continue;
      const id = rule.assetId;

      const latestVal = latestDp[id];
      const prevVal = prevDp[id];
      if (!latestVal || !prevVal) continue;

      const close =
        typeof latestVal === "object" ? latestVal.close : latestVal;
      const prevClose =
        typeof prevVal === "object" ? prevVal.close : prevVal;

      const ind = newIndicators[id];
      if (!ind) continue;

      if (rule.type === "price_cross_sma20_up" && ind.sma20 != null) {
        const currAbove = close > ind.sma20;
        const prevAbove = prevCrossState[id];

        if (prevAbove === undefined) {
          nextCrossState[id] = currAbove;
        } else {
          if (prevAbove === false && currAbove === true) {
            onStrategySignal?.({
              assetId: id,
              side: "BUY",
              ruleType: rule.type,
              price: close,
              time: latestDp.time,
            });
          }
          nextCrossState[id] = currAbove;
        }
      }

      if (rule.type === "rsi_overbought" && ind.rsi14 != null) {
        const threshold = rule.rsiThreshold ?? 70;
        if (ind.rsi14 > threshold) {
          onStrategySignal?.({
            assetId: id,
            side: "SELL",
            ruleType: rule.type,
            price: close,
            time: latestDp.time,
          });
        }
      }

      void prevClose;
    }

    setPrevCrossState(nextCrossState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, strategyRules]);

  // persist config
  useEffect(() => {
    if (!uid || !loaded) return;
    const config: AssetChartConfig[] = assets.map((a) => ({
      id: a.id,
      type: a.type,
      visible: a.visible,
    }));
    setMultiAssetConfig(uid, config).catch((e) =>
      console.error("Failed to save multiAsset config", e)
    );
  }, [assets, uid, loaded]);

  const handleToggleVisible = (id: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, visible: !a.visible } : a
      )
    );
  };

  const handleTypeChange = (id: string, type: ChartType) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, type } : a))
    );
  };

  const handlePatternFilterChange = (key: PatternType) => {
    setPatternFilter((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // styling
  const titleText = isDark ? "text-white" : "text-gray-900";
  const controlBg = isDark ? "bg-gray-800" : "bg-gray-200";
  const selectBg =
    isDark
      ? "bg-gray-900 border border-gray-700 text-gray-200"
      : "bg-white border-gray-300 text-gray-800";
  const chartWrapperBg = isDark ? "bg-gray-900" : "bg-gray-100";
  const gridColor = isDark ? "#374151" : "#E5E7EB";
  const axisColor = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#111827" : "#FFFFFF";
  const tooltipBorder = isDark ? "#374151" : "#D1D5DB";
  const tooltipText = isDark ? "#E5E7EB" : "#111827";

  // flatten data for chart Y axis
  const valueAccessor = (assetId: string, dp: DataPoint) => {
    const v = dp[assetId];
    if (!v) return undefined;
    if (typeof v === "number") return v;
    if (typeof v === "object" && "close" in v) return v.close;
    return undefined;
  };

  const flatDataForYAxis = data.map((dp, index) => {
    const out: any = { time: dp.time, index };
    for (const a of assets) {
      const v = valueAccessor(a.id, dp);
      if (v != null) out[a.id] = v;
    }
    return out;
  });

  // pattern markers
  const renderPatternMarkers = (props: any) => {
    const { xAxisMap, yAxisMap } = props;
    if (!xAxisMap || !yAxisMap) return null;

    const activePatterns = patterns.filter((p) => {
      if (p.type === "hammer" && !patternFilter.hammer) return false;
      if (p.type === "doji" && !patternFilter.doji) return false;
      if (
        p.type === "bullish_engulfing" &&
        !patternFilter.bullish_engulfing
      )
        return false;
      return true;
    });

    const xScale = xAxisMap[Object.keys(xAxisMap)[0]].scale;
    const yScale = yAxisMap[Object.keys(yAxisMap)[0]].scale;

    return (
      <Layer>
        {activePatterns.map((p, idx) => {
          const dp = flatDataForYAxis[p.index];
          if (!dp) return null;
          const x = xScale(dp.time);
          const price = dp["BTC"];
          if (price == null) return null;
          const y = yScale(price);

          let color = "#A855F7";
          if (p.type === "hammer") color = "#22C55E";
          if (p.type === "bullish_engulfing") color = "#F97316";

          const radius =
            p.type === "hammer" && patternFilter.hammer
              ? 5
              : p.type === "doji" && patternFilter.doji
              ? 5
              : p.type === "bullish_engulfing" &&
                patternFilter.bullish_engulfing
              ? 5
              : 3;

          return (
            <g key={`${p.type}-${p.index}-${idx}`}>
              <circle cx={x} cy={y + 14} r={radius} fill={color} />
            </g>
          );
        })}
      </Layer>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className={`text-lg font-semibold ${titleText}`}>
          Multi‑Asset Analytics (Random Data)
        </h2>
        <div className="flex flex-wrap gap-3 text-xs items-center">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`flex items-center gap-2 ${controlBg} px-2 py-1 rounded-full`}
            >
              <input
                type="checkbox"
                checked={asset.visible}
                onChange={() => handleToggleVisible(asset.id)}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: asset.color }}
              />
              <span className={titleText}>{asset.id}</span>
              <select
                value={asset.type}
                onChange={(e) =>
                  handleTypeChange(asset.id, e.target.value as ChartType)
                }
                className={`${selectBg} rounded px-1 py-0.5 text-[10px]`}
              >
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="candlestick">Candles</option>
              </select>
            </div>
          ))}

          {/* Time window selector */}
          <div className="flex items-center gap-1 ml-4 text-[11px]">
            <span className={titleText}>Window:</span>
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className={`${selectBg} rounded px-1 py-0.5 text-[10px]`}
            >
              <option value={60}>~1 min</option>
              <option value={180}>~3 min</option>
              <option value={600}>~10 min</option>
            </select>
          </div>

          {/* Pattern filters */}
          <div className="flex flex-wrap gap-2 ml-4">
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={patternFilter.hammer}
                onChange={() => handlePatternFilterChange("hammer")}
              />
              <span className="text-green-400">Hammer</span>
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={patternFilter.doji}
                onChange={() => handlePatternFilterChange("doji")}
              />
              <span className="text-purple-400">Doji</span>
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={patternFilter.bullish_engulfing}
                onChange={() =>
                  handlePatternFilterChange("bullish_engulfing")
                }
              />
              <span className="text-orange-400">Engulfing</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main chart */}
      <div className={`h-72 ${chartWrapperBg} rounded-lg p-3`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={flatDataForYAxis}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" stroke={axisColor} />
            <YAxis stroke={axisColor} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "0.5rem",
                color: tooltipText,
              }}
              labelStyle={{ color: tooltipText }}
              itemStyle={{ color: tooltipText }}
              formatter={(value: any, name, props: any) => {
                const idx = props?.payload?.index;
                const dataKey: string = props?.dataKey || name;

                if (typeof idx !== "number" || !data[idx]) {
                  const num =
                    typeof value === "number" ? value : Number(value);
                  return [isNaN(num) ? value : num.toFixed(2), dataKey];
                }

                const original = data[idx];
                const v = original[dataKey];

                if (v && typeof v === "object" && "open" in v) {
                  const hitsHere = patterns.filter(
                    (p) => p.assetId === dataKey && p.index === idx
                  );
                  const patternText =
                    hitsHere.length > 0
                      ? " | " +
                        hitsHere
                          .map((p) => {
                            if (p.type === "hammer")
                              return "Hammer: potential bullish reversal after a down move";
                            if (p.type === "doji")
                              return "Doji: indecision, possible pause or reversal";
                            if (p.type === "bullish_engulfing")
                              return "Bullish Engulfing: strong bullish reversal signal";
                            return p.type;
                          })
                          .join(" | ")
                      : "";

                  return [
                    `O:${v.open.toFixed(2)} H:${v.high.toFixed(
                      2
                    )} L:${v.low.toFixed(2)} C:${v.close.toFixed(
                      2
                    )}${patternText}`,
                    dataKey,
                  ];
                }

                const num =
                  typeof value === "number" ? value : Number(value);
                return [isNaN(num) ? value : num.toFixed(2), dataKey];
              }}
            />
            <Legend
              wrapperStyle={{
                color: tooltipText,
                fontSize: 11,
              }}
            />

            {assets
              .filter((a) => a.visible)
              .map((asset) => {
                if (asset.type === "bar") {
                  return (
                    <Bar
                      key={asset.id}
                      dataKey={asset.id}
                      name={asset.id}
                      fill={asset.color}
                      barSize={8}
                    />
                  );
                }
                if (asset.type === "candlestick") {
                  return (
                    <Bar
                      key={asset.id}
                      dataKey={asset.id}
                      name={asset.id}
                      shape={
                        <CandleShape
                          dataKey={asset.id}
                          color={asset.color}
                        />
                      }
                    />
                  );
                }
                return (
                  <Line
                    key={asset.id}
                    type="monotone"
                    dataKey={asset.id}
                    name={asset.id}
                    stroke={asset.color}
                    dot={false}
                    strokeWidth={2}
                  />
                );
              })}

            <Customized component={renderPatternMarkers} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Indicator summary panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
        {ASSETS_INITIAL.map((asset) => {
          const vals = indicators[asset.id];
          if (!vals) return null;

          const showSma = enabledIndicators.includes("sma");
          const showRsi = enabledIndicators.includes("rsi");
          const showVol = enabledIndicators.includes("vol");

          return (
            <div
              key={asset.id}
              className={`rounded-lg px-3 py-2 ${
                isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs">
                  {asset.id} Indicators
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
              </div>

              {showSma && vals.sma20 != null && (
                <div>
                  SMA20:{" "}
                  <span className="font-medium">
                    {vals.sma20.toFixed(2)}
                  </span>
                </div>
              )}

              {showRsi && vals.rsi14 != null && (
                <div>
                  RSI14:{" "}
                  <span
                    className={
                      vals.rsi14 > 70
                        ? "text-red-500 font-medium"
                        : vals.rsi14 < 30
                        ? "text-green-500 font-medium"
                        : "font-medium"
                    }
                  >
                    {vals.rsi14.toFixed(1)}
                  </span>
                </div>
              )}

              {showVol && vals.vol20 != null && (
                <div>
                  Vol20:{" "}
                  <span
                    className={
                      vals.vol20 > 0.03
                        ? "text-red-500 font-medium"
                        : vals.vol20 > 0.015
                        ? "text-yellow-500 font-medium"
                        : "text-green-500 font-medium"
                    }
                  >
                    {(vals.vol20 * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Strategy Rules Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
        {ASSETS_INITIAL.map((asset) => {
          const rulesForAsset = strategyRules.filter(
            (r) => r.assetId === asset.id
          );

          return (
            <div
              key={asset.id}
              className={`rounded-lg px-3 py-2 ${
                isDark ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs">
                  {asset.id} Strategies
                </span>
              </div>

              {rulesForAsset.map((rule, idx) => {
                if (rule.type === "price_cross_sma20_up") {
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between mb-1"
                    >
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => {
                            setStrategyRules((prev) =>
                              prev.map((r) =>
                                r === rule ? { ...r, enabled: !r.enabled } : r
                              )
                            );
                          }}
                        />
                        <span>Buy on SMA20 cross up</span>
                      </label>
                    </div>
                  );
                }

                if (rule.type === "rsi_overbought") {
                  return (
                    <div key={idx} className="flex flex-col gap-1 mb-1">
                      <label className="flex items-center justify-between">
                        <span>Sell when RSI &gt; threshold</span>
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => {
                            setStrategyRules((prev) =>
                              prev.map((r) =>
                                r === rule ? { ...r, enabled: !r.enabled } : r
                              )
                            );
                          }}
                        />
                      </label>
                      <div className="flex items-center gap-1">
                        <span>Threshold:</span>
                        <input
                          type="number"
                          min={50}
                          max={90}
                          step={1}
                          value={rule.rsiThreshold ?? 70}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 70;
                            setStrategyRules((prev) =>
                              prev.map((r) =>
                                r === rule
                                  ? { ...r, rsiThreshold: val }
                                  : r
                              )
                            );
                          }}
                          className={`w-14 text-right px-1 py-0.5 rounded border ${
                            isDark
                              ? "bg-gray-900 border-gray-700 text-gray-200"
                              : "bg-white border-gray-300 text-gray-800"
                          }`}
                        />
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-500">
        This dashboard simulates live multi‑asset markets and computes key
        indicators in real time: SMA20 (trend), RSI14 (momentum), and
        20‑period volatility (risk). It also highlights classical candlestick
        patterns (Hammer, Doji, Bullish Engulfing) with explanations in the
        tooltip. Use the indicator toggles, pattern filters, time window
        selector, and strategy settings to experiment with automated trading
        ideas and deepen your understanding of trends, momentum, risk, and
        price behavior.
      </p>
    </div>
  );
}