import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type Watchlist = string[]; // e.g. ["AAPL", "TSLA"]

export async function getWatchlist(uid: string): Promise<Watchlist> {
  const ref = doc(db, "users", uid, "data", "watchlist");
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return (snap.data().symbols as string[]) || [];
}

export async function setWatchlist(
  uid: string,
  symbols: string[]
) {
  const ref = doc(db, "users", uid, "data", "watchlist");
  await setDoc(ref, { symbols }, { merge: true });
}

export async function addToWatchlist(
  uid: string,
  symbol: string
) {
  const current = await getWatchlist(uid);
  if (current.includes(symbol)) return;
  await setWatchlist(uid, [...current, symbol]);
}

export async function removeFromWatchlist(
  uid: string,
  symbol: string
) {
  const current = await getWatchlist(uid);
  await setWatchlist(
    uid,
    current.filter((s) => s !== symbol)
  );
}