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
  // for each asset we store OHLC object for candles, { close } for line/bar
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

/* ---------- Pattern detection types/helpers ---------- */

type PatternType = "hammer" | "doji" | "bullish_engulfing";

type PatternHit = {
  index: number; // index in data[]
  assetId: string; // "BTC"
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

/* ---------- Indicators & strategy types ---------- */

type IndicatorValues = {
  sma20?: number;
  rsi14?: number;
};

type IndicatorState = Record<string, IndicatorValues>;

type StrategyRuleType = "price_cross_sma20_up" | "rsi_overbought";

type StrategyRule = {
  assetId: string;
  type: StrategyRuleType;
  enabled: boolean;
  size: number; // quantity per trade
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
  const res: (number | undefined)[] = new Array(values.length).fill(undefined);
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

// Wilder's RSI(14) approximation
function calcRSI(values: number[], period = 14): (number | undefined)[] {
  const res: (number | undefined)[] = new Array(values.length).fill(undefined);
  if (values.length < period + 1) return res;

  let gainSum = 0;
  let lossSum = 0;

  // First average gain/loss over initial period
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    gainSum += gain;
    lossSum += loss;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // First RSI at index `period`
  {
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    res[period] = rsi;
  }

  // Subsequent RSIs
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

/* ---------- Component ---------- */

export default function MultiAssetChart({
  isDark,
  uid,
  onStrategySignal,
}: {
  isDark: boolean;
  uid: string;
  onStrategySignal?: (signal: StrategySignal) => void;
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

  // simple default rules for all assets
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
    },
  ]);
  const [strategyRules] = useState<StrategyRule[]>(defaultRules);

  // load saved asset config from Firestore
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

  // init + live updates for data
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
        if (nextData.length > 60) nextData.shift();
        return nextData;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // compute indicators (SMA20, RSI14) for all assets and fire strategy
  useEffect(() => {
    const newIndicators: IndicatorState = {};

    for (const asset of ASSETS_INITIAL) {
      const closes = data.map((dp) => {
        const v = dp[asset.id];
        if (!v) return undefined;
        if (typeof v === "number") return v;
        if (typeof v === "object" && "close" in v) return v.close as number;
        return undefined;
      });

      const numericCloses = closes.map((v) => v ?? 0);
      const smaArr = calcSMA(numericCloses, 20);
      const rsiArr = calcRSI(numericCloses, 14);

      const lastIdx = data.length - 1;
      if (lastIdx >= 0) {
        newIndicators[asset.id] = {
          sma20: smaArr[lastIdx],
          rsi14: rsiArr[lastIdx],
        };
      }
    }

    setIndicators(newIndicators);

    // strategy evaluation for latest candle
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

      const close = typeof latestVal === "object" ? latestVal.close : latestVal;
      const prevClose =
        typeof prevVal === "object" ? prevVal.close : prevVal;

      const ind = newIndicators[id];
      if (!ind) continue;

      // price_cross_sma20_up
      if (rule.type === "price_cross_sma20_up" && ind.sma20 != null) {
        const currAbove = close > ind.sma20;
        const prevAbove = prevCrossState[id];
        if (prevAbove === false && currAbove === true) {
          // crossing upwards now
          if (onStrategySignal) {
            onStrategySignal({
              assetId: id,
              side: "BUY",
              ruleType: rule.type,
              price: close,
              time: latestDp.time,
            });
          }
        }
        nextCrossState[id] = currAbove;
      }

      // rsi_overbought
      if (rule.type === "rsi_overbought" && ind.rsi14 != null) {
        if (ind.rsi14 > 70) {
          if (onStrategySignal) {
            onStrategySignal({
              assetId: id,
              side: "SELL",
              ruleType: rule.type,
              price: close,
              time: latestDp.time,
            });
          }
        }
      }

      // prevClose used so TS doesn't complain it's unused, and you
      // can extend logic later if needed
      void prevClose;
    }

    setPrevCrossState(nextCrossState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // persist asset config when it changes, after initial load
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

  // styling based on theme
  const titleText = isDark ? "text-white" : "text-gray-900";
  const controlBg = isDark ? "bg-gray-800" : "bg-gray-200";
  const selectBg =
    isDark
      ? "bg-gray-900 border border-gray-700 text-gray-200"
      : "bg-white border border-gray-300 text-gray-800";
  const chartWrapperBg = isDark ? "bg-gray-900" : "bg-gray-100";
  const gridColor = isDark ? "#374151" : "#E5E7EB";
  const axisColor = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#111827" : "#FFFFFF";
  const tooltipBorder = isDark ? "#374151" : "#D1D5DB";
  const tooltipText = isDark ? "#E5E7EB" : "#111827";

  // helper to flatten OHLC into numeric for Y-axis
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

  // pattern markers renderer
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

          let color = "#A855F7"; // purple for doji
          if (p.type === "hammer") color = "#22C55E"; // green
          if (p.type === "bullish_engulfing") color = "#F97316"; // orange

          return (
            <g key={`${p.type}-${p.index}-${idx}`}>
              <circle cx={x} cy={y + 14} r={4} fill={color} />
            </g>
          );
        })}
      </Layer>
    );
  };

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className={`text-lg font-semibold ${titleText}`}>
          Multi‑Asset Chart (Random Data)
        </h2>
        <div className="flex flex-wrap gap-3 text-xs items-center">
          {/* asset toggles */}
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

          {/* pattern filters */}
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

      {/* chart */}
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
              labelStyle={{
                color: tooltipText,
              }}
              itemStyle={{
                color: tooltipText,
              }}
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
                            if (p.type === "hammer") return "Hammer";
                            if (p.type === "doji") return "Doji";
                            if (p.type === "bullish_engulfing")
                              return "Bullish Engulfing";
                            return p.type;
                          })
                          .join(", ")
                      : "";

                  return [
                    `O:${v.open.toFixed(2)} H:${v.high.toFixed(
                      2
                    )} L:${v.low.toFixed(2)} C:${v.close.toFixed(2)}${patternText}`,
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

            {/* pattern markers for BTC */}
            <Customized component={renderPatternMarkers} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-gray-500">
        Candles are simulated OHLC data (open, high, low, close). Detected
        patterns (Hammer, Doji, Bullish Engulfing) are highlighted for BTC and
        update as new candles form. Simple strategies (price crossing SMA20 &
        RSI overbought) are evaluated for all assets, emitting signals back to
        the dashboard.
      </p>
    </div>
  );
}