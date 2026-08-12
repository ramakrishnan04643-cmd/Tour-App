import React from "react";
import ReactDOM from "react-dom/client";
import TourLedger from "./TourLedger.jsx";

/**
 * Tour Ledger was originally built for Claude.ai's artifact environment,
 * which provides a `window.storage` API. Calls made with `shared: true`
 * were visible to everyone using the app; calls made with `shared: false`
 * were private to each person's own Claude account.
 *
 * Outside Claude there's no such built-in identity or shared database, so
 * this file recreates the same `window.storage` shape using two things:
 *
 *   - shared: true  -> calls the Tour Ledger API (Express + Postgres,
 *     hosted on Render). This is REAL shared data — every device talking
 *     to the same API sees the same trips and expenses.
 *   - shared: false -> stays in this browser's localStorage. Right now
 *     the app only uses this for "session" (remembering who's logged in
 *     on this device), which is genuinely device-specific by design —
 *     that part doesn't need to be shared.
 *
 * Set VITE_API_URL (see .env.example) to your deployed backend's URL.
 */

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

if (!API_BASE) {
  console.warn(
    "VITE_API_URL is not set. Shared data (trips, accounts, expenses) will fail. " +
      "Set it to your Render backend URL, e.g. https://tour-ledger-api.onrender.com"
  );
}

const localScope = {
  read() {
    try {
      return JSON.parse(localStorage.getItem("tour-ledger-local") || "{}");
    } catch {
      return {};
    }
  },
  write(data) {
    localStorage.setItem("tour-ledger-local", JSON.stringify(data));
  },
};

window.storage = {
  async get(key, shared = false) {
    if (!shared) {
      const data = localScope.read();
      if (!(key in data)) return null;
      return { key, value: data[key], shared: false };
    }
    const res = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`storage get failed (${res.status})`);
    const json = await res.json();
    return { key, value: json.value, shared: true };
  },

  async set(key, value, shared = false) {
    if (!shared) {
      const data = localScope.read();
      data[key] = value;
      localScope.write(data);
      return { key, value, shared: false };
    }
    const res = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`storage set failed (${res.status})`);
    return { key, value, shared: true };
  },

  async delete(key, shared = false) {
    if (!shared) {
      const data = localScope.read();
      const existed = key in data;
      delete data[key];
      localScope.write(data);
      return { key, deleted: existed, shared: false };
    }
    const res = await fetch(`${API_BASE}/api/storage/${encodeURIComponent(key)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`storage delete failed (${res.status})`);
    const json = await res.json();
    return { key, deleted: !!json.deleted, shared: true };
  },

  async list(prefix = "", shared = false) {
    if (!shared) {
      const data = localScope.read();
      return { keys: Object.keys(data).filter((k) => k.startsWith(prefix)), prefix, shared: false };
    }
    const res = await fetch(`${API_BASE}/api/storage?prefix=${encodeURIComponent(prefix)}`);
    if (!res.ok) throw new Error(`storage list failed (${res.status})`);
    const json = await res.json();
    return { keys: json.keys, prefix, shared: true };
  },
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TourLedger />
  </React.StrictMode>
);
