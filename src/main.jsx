import React from "react";
import ReactDOM from "react-dom/client";
import TourLedger from "./TourLedger.jsx";

/**
 * Tour Ledger was originally built for Claude.ai's artifact environment,
 * which provides a `window.storage` API (get/set/delete/list) with a
 * "shared" flag that makes data visible to everyone using the artifact.
 * That API doesn't exist in a normal browser, so it won't work as-is once
 * hosted on GitHub Pages or any other static host.
 *
 * This shim below makes the app RUNNABLE outside Claude by backing
 * window.storage with the browser's localStorage. Read this as a stopgap,
 * not a real fix:
 *
 *   - There is no "shared" data anymore. Every visitor's browser has its
 *     own separate localStorage, so people will NOT see each other's
 *     trips or expenses just by opening the same URL. Each person would
 *     effectively be using their own private copy of the app.
 *   - Data lives only in that one browser. Clearing site data, switching
 *     browsers, or using a different device loses it.
 *
 * To get real shared, multi-device syncing back, `window.storage` needs
 * to be replaced with calls to a real backend (e.g. Firebase, Supabase,
 * or your own API) that everyone's browser talks to. That's a separate,
 * bigger change from this shim.
 */
if (!window.storage) {
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem("tour-ledger-data") || "{}");
    } catch {
      return {};
    }
  };
  const write = (data) => localStorage.setItem("tour-ledger-data", JSON.stringify(data));

  window.storage = {
    async get(key) {
      const data = read();
      if (!(key in data)) return null;
      return { key, value: data[key], shared: false };
    },
    async set(key, value) {
      const data = read();
      data[key] = value;
      write(data);
      return { key, value, shared: false };
    },
    async delete(key) {
      const data = read();
      const existed = key in data;
      delete data[key];
      write(data);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix = "") {
      const data = read();
      const keys = Object.keys(data).filter((k) => k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TourLedger />
  </React.StrictMode>
);
