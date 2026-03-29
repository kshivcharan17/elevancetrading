"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
      {/* We will add watchlist/portfolio UI here later */}
    </main>
  );
}