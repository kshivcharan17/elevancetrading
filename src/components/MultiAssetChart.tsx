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

/* ---------- Component ---------- */

export default function MultiAssetChart({
  isDark,
  uid,
}: {
  isDark: boolean;
  uid: string;
}) {
  const [assets, setAssets] = useState<AssetConfig[]>(ASSETS_INITIAL);
  const [data, setData] = useState<DataPoint[]>([]);
  const [lastValues, setLastValues] = useState<Record<string, number>>({
    AAPL: 180,
    BND: 100,
    BTC: 50000,
  });

  // NEW: tracks whether we've finished loading config from Firestore
  const [loaded, setLoaded] = useState(false);

  // load saved asset config from Firestore
  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const saved = await getMultiAssetConfig(uid);
        console.log("Loaded multiAsset config:", saved);
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
        setLoaded(true); // mark load as done (even if nothing saved yet)
      }
    })();
  }, [uid]);

  // init + live updates for data (independent of assets config)
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

  // persist asset config when it changes,
  // BUT ONLY AFTER initial load is complete
  useEffect(() => {
    if (!uid || !loaded) return;
    const config: AssetChartConfig[] = assets.map((a) => ({
      id: a.id,
      type: a.type,
      visible: a.visible,
    }));
    console.log("Saving multiAsset config:", config);
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

  const flatDataForYAxis = data.map((dp) => {
    const out: any = { time: dp.time };
    for (const a of assets) {
      const v = valueAccessor(a.id, dp);
      if (v != null) out[a.id] = v;
    }
    return out;
  });

  return (
    <div className="space-y-4">
      {/* controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className={`text-lg font-semibold ${titleText}`}>
          Multi‑Asset Chart (Random Data)
        </h2>
        <div className="flex flex-wrap gap-3 text-xs">
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
                  return [
                    `O:${v.open.toFixed(2)} H:${v.high.toFixed(
                      2
                    )} L:${v.low.toFixed(2)} C:${v.close.toFixed(2)}`,
                    dataKey,
                  ];
                }

                const num =
                  typeof value === "number" ? value : Number(value);
                return [isNaN(num) ? value : num.toFixed(2), dataKey];
              }}
            />
            <Legend />

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
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-gray-500">
        Candles are simulated OHLC data (open, high, low, close) for demo
        purposes. Toggle assets and change chart types to explore multi‑asset
        comparisons.
      </p>
    </div>
  );
}