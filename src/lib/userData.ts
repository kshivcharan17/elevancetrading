// src/lib/userData.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type Watchlist = string[]; 

export async function getWatchlist(uid: string): Promise<Watchlist> {
  const ref = doc(db, "users", uid, "data", "watchlist");
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data().symbols as string[]) || [];
}

export async function setWatchlist(uid: string, symbols: string[]) {
  const ref = doc(db, "users", uid, "data", "watchlist");
  await setDoc(ref, { symbols }, { merge: true });
}

export type Preferences = {
  theme?: "light" | "dark";
  currency?: "USD" | "INR" | "EUR";
  defaultTimeframe?: "1D" | "1W" | "1M";
};

export async function getPreferences(uid: string): Promise<Preferences> {
  const ref = doc(db, "users", uid, "data", "profile");
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  return snap.data() as Preferences;
}

export async function setPreferences(uid: string, prefs: Preferences) {
  const ref = doc(db, "users", uid, "data", "profile");
  await setDoc(ref, prefs, { merge: true });
}

export type Holding = {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
};

export type Portfolio = Holding[];

export async function getPortfolio(uid: string): Promise<Portfolio> {
  const ref = doc(db, "users", uid, "data", "portfolio");
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data().holdings as Portfolio) || [];
}

export async function setPortfolio(uid: string, holdings: Portfolio) {
  const ref = doc(db, "users", uid, "data", "portfolio");
  await setDoc(ref, { holdings }, { merge: true });
}

export type Indicator = {
  id: string;
  enabled: boolean;
  settings?: Record<string, any>;
};

export type IndicatorsState = Indicator[];

export async function getIndicators(uid: string): Promise<IndicatorsState> {
  const ref = doc(db, "users", uid, "data", "indicators");
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data().items as IndicatorsState) || [];
}

export async function setIndicators(
  uid: string,
  items: IndicatorsState
) {
  const ref = doc(db, "users", uid, "data", "indicators");
  await setDoc(ref, { items }, { merge: true });
}

// Multi‑asset chart configuration

export type AssetChartConfig = {
  id: string;
  type: "line" | "bar" | "candlestick";
  visible: boolean;
};

export async function getMultiAssetConfig(
  uid: string
): Promise<AssetChartConfig[] | null> {
  const ref = doc(db, "users", uid, "data", "multiAssetChart");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return (snap.data().assets as AssetChartConfig[]) || null;
}

export async function setMultiAssetConfig(
  uid: string,
  assets: AssetChartConfig[]
) {
  const ref = doc(db, "users", uid, "data", "multiAssetChart");
  await setDoc(ref, { assets }, { merge: true });
}