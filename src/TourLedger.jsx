import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, ArrowLeft, Trash2, MapPin, CalendarDays, Users, Receipt, X, LogOut,
  Plane, Wallet, BedDouble, UtensilsCrossed, Bus, Compass, Package, Sparkles,
  Pencil, Archive, ShieldCheck, RotateCcw, UserCog,
} from "lucide-react";

const CATEGORY_META = {
  Stay: { icon: BedDouble, color: "#8A5CB0" },
  Food: { icon: UtensilsCrossed, color: "#F0704F" },
  Transport: { icon: Bus, color: "#2BA6A0" },
  Activity: { icon: Compass, color: "#E2A020" },
  Other: { icon: Package, color: "#4E9A63" },
};
const CATEGORIES = Object.keys(CATEGORY_META);

const STATUS_META = {
  Pending: { color: "#E2A020" },
  Ongoing: { color: "#2BA6A0" },
  Completed: { color: "#4E9A63" },
  Cancelled: { color: "#E0553D" },
};
const STATUSES = Object.keys(STATUS_META);

const fmt = (n) =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Simple, non-cryptographic hash so PINs aren't stored as plain text.
// This is a lightweight access gate for a shared trip list, not real security.
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function CategoryIcon({ category, size = 14 }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size + 14, height: size + 14, borderRadius: "50%", background: meta.color + "22", color: meta.color, flexShrink: 0 }}>
      <Icon size={size} />
    </span>
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: meta.color, background: meta.color + "1c", border: `1.5px solid ${meta.color}55`, borderRadius: 20, padding: "3px 10px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }} />
      {status || "Pending"}
    </span>
  );
}

function SplitFlap({ value }) {
  const digits = fmt(value).split("");
  return (
    <div style={{ display: "inline-flex", gap: 3, flexWrap: "wrap" }}>
      {digits.map((ch, i) => (
        <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", background: "#FFFFFF", color: "var(--plum)", border: "1px solid var(--border)", borderRadius: 4, padding: ch === "." || ch === "," ? "6px 2px" : "6px 7px", fontSize: 22, fontWeight: 700, minWidth: ch === "." || ch === "," ? 6 : 18, textAlign: "center", lineHeight: 1, boxShadow: "0 1px 0 rgba(43,33,24,0.06)" }}>
          {ch}
        </span>
      ))}
    </div>
  );
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Nunito:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
    :root {
      --bg-a: #FBF2FF; --bg-b: #FFF2E4;
      --panel: #FFFFFF; --panel-soft: #FBF7F1;
      --coral: #F0704F; --teal: #2BA6A0; --gold: #E2A020; --plum: #8A5CB0; --sage: #4E9A63;
      --text: #2B2118; --text-dim: #7A6F63; --border: #ECE1D4; --danger: #E0553D;
    }
    .tl-btn { font-family: 'Nunito', sans-serif; background: var(--coral); color: #FFFFFF; border: none; border-radius: 10px; padding: 12px 18px; font-weight: 700; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 3px 0 #C9532F; transition: transform 0.05s ease; }
    .tl-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 #C9532F; }
    .tl-btn:disabled { opacity: 0.6; cursor: default; }
    .tl-btn-teal { background: var(--teal); box-shadow: 0 3px 0 #1E7C77; }
    .tl-btn-teal:active { box-shadow: 0 1px 0 #1E7C77; }
    .tl-btn-plum { background: var(--plum); box-shadow: 0 3px 0 #6B4189; }
    .tl-btn-plum:active { box-shadow: 0 1px 0 #6B4189; }
    .tl-btn-danger { background: var(--danger); box-shadow: 0 3px 0 #A83B27; }
    .tl-btn-danger:active { box-shadow: 0 1px 0 #A83B27; }
    .tl-btn-ghost { background: transparent; color: var(--text); border: 1.5px solid var(--border); box-shadow: none; }
    .tl-btn-ghost:active { transform: none; }
    .tl-btn-ghost:hover { background: var(--panel-soft); }
    .tl-input, .tl-select { font-family: 'Nunito', sans-serif; background: var(--panel-soft); border: 1.5px solid var(--border); color: var(--text); border-radius: 8px; padding: 11px; font-size: 15px; width: 100%; box-sizing: border-box; color-scheme: light; }
    .tl-input:focus, .tl-select:focus { outline: 2px solid var(--plum); outline-offset: 1px; }
    .tl-input::placeholder { color: var(--text-dim); }
    .tl-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dim); font-weight: 700; display: block; margin-bottom: 6px; }
    .tl-chip { display: inline-flex; align-items: center; gap: 4px; background: var(--panel-soft); border: 1.5px solid var(--border); border-radius: 20px; padding: 5px 11px; font-size: 12px; color: var(--text-dim); font-weight: 600; }
    .tl-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .tl-check { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; cursor: pointer; background: var(--panel-soft); }
    .tl-check input { width: 16px; height: 16px; accent-color: var(--plum); }
  `}</style>
);

export default function TourLedger() {
  const [session, setSession] = useState(undefined);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [view, setView] = useState("home");
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = session && session.role === "admin";

  useEffect(() => { restoreSession(); }, []);
  useEffect(() => { if (session) loadTrips(); }, [session]);

  async function restoreSession() {
    try {
      const res = await window.storage.get("session", false);
      setSession(res ? JSON.parse(res.value) : null);
    } catch {
      setSession(null);
    }
  }

  async function loadTrips() {
    setLoadingTrips(true);
    try {
      const res = await window.storage.get("trips-index", true);
      setTrips(res ? JSON.parse(res.value) : []);
    } catch {
      setTrips([]);
    }
    setLoadingTrips(false);
  }

  async function handleLogin(name, role) {
    const s = { name, role };
    try { await window.storage.set("session", JSON.stringify(s), false); } catch {}
    setSession(s);
  }

  async function handleLogout() {
    try { await window.storage.delete("session", false); } catch {}
    setSession(null);
    setView("home");
    setActiveTrip(null);
  }

  async function createTrip(data) {
    const id = uid();
    const trip = {
      id,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      places: data.places,
      numPeople: data.numPeople,
      travelers: data.travelers,
      status: data.status,
      createdAt: new Date().toISOString(),
      expenses: [],
    };
    try {
      await window.storage.set(`trip:${id}`, JSON.stringify(trip), true);
      const summary = { id, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, numPeople: trip.numPeople, travelers: trip.travelers, status: trip.status, createdAt: trip.createdAt };
      const newIndex = [summary, ...trips];
      await window.storage.set("trips-index", JSON.stringify(newIndex), true);
      setTrips(newIndex);
      setActiveTrip(trip);
      setView("trip");
    } catch {
      setError("Couldn't create the tour. Try again.");
    }
  }

  async function updateTrip(tripId, data) {
    const updated = { ...activeTrip, ...data };
    try {
      await window.storage.set(`trip:${tripId}`, JSON.stringify(updated), true);
      const newIndex = trips.map((t) =>
        t.id === tripId
          ? { ...t, destination: data.destination, startDate: data.startDate, endDate: data.endDate, numPeople: data.numPeople, travelers: data.travelers, status: data.status }
          : t
      );
      await window.storage.set("trips-index", JSON.stringify(newIndex), true);
      setTrips(newIndex);
      setActiveTrip(updated);
      setView("trip");
    } catch {
      setError("Couldn't save changes. Try again.");
    }
  }

  async function openTrip(id) {
    setLoadingTrip(true);
    setView("trip");
    try {
      const res = await window.storage.get(`trip:${id}`, true);
      const t = res ? JSON.parse(res.value) : null;
      if (t && !isAdmin && !(t.travelers || []).includes(session.name)) {
        setError("You're not part of that tour.");
        setActiveTrip(null);
        setView("home");
      } else {
        setActiveTrip(t);
      }
    } catch {
      setError("Couldn't load that tour.");
    }
    setLoadingTrip(false);
  }

  async function saveActiveTrip(updated) {
    setActiveTrip(updated);
    try {
      await window.storage.set(`trip:${updated.id}`, JSON.stringify(updated), true);
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    }
  }

  async function addExpense(expense) {
    const updated = { ...activeTrip, expenses: [{ ...expense, id: uid() }, ...activeTrip.expenses] };
    await saveActiveTrip(updated);
  }

  async function deleteExpense(expenseId) {
    const updated = { ...activeTrip, expenses: activeTrip.expenses.filter((e) => e.id !== expenseId) };
    await saveActiveTrip(updated);
  }

  // Soft delete: the trip stays fully intact at trip:<id>, just moved out of
  // the active index and into a deleted one, so it can be viewed or restored.
  async function deleteTrip(tripId) {
    try {
      const entry = trips.find((t) => t.id === tripId);
      const newIndex = trips.filter((t) => t.id !== tripId);
      await window.storage.set("trips-index", JSON.stringify(newIndex), true);
      setTrips(newIndex);

      const delRes = await window.storage.get("deleted-trips-index", true);
      const deleted = delRes ? JSON.parse(delRes.value) : [];
      const newDeleted = [{ ...entry, deletedAt: new Date().toISOString() }, ...deleted];
      await window.storage.set("deleted-trips-index", JSON.stringify(newDeleted), true);

      setActiveTrip(null);
      setView("home");
    } catch {
      setError("Couldn't delete the tour. Try again.");
    }
  }

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "linear-gradient(160deg, var(--bg-a) 0%, var(--bg-b) 100%)", color: "var(--text)", minHeight: 480, padding: "24px 16px 40px", borderRadius: 14 }}>
      <GlobalStyle />

      {error && (
        <div style={{ background: "#FDE7E1", border: "1.5px solid var(--danger)", color: "#9A3A26", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <span>{error}</span>
          <X size={16} style={{ cursor: "pointer" }} onClick={() => setError("")} />
        </div>
      )}

      {session === undefined && <p style={{ color: "var(--text-dim)" }}>Loading…</p>}
      {session === null && <LoginScreen onLogin={handleLogin} />}

      {session && view === "home" && (
        <Home trips={trips} loading={loadingTrips} onOpen={openTrip} onNew={() => setView("new")} session={session} isAdmin={isAdmin} onLogout={handleLogout} onOpenPeople={() => setView("people")} onOpenDeleted={() => setView("deleted")} />
      )}
      {session && view === "new" && isAdmin && (
        <TripForm mode="create" onCancel={() => setView("home")} onSubmit={createTrip} />
      )}
      {session && view === "edit" && isAdmin && activeTrip && (
        <TripForm mode="edit" trip={activeTrip} onCancel={() => setView("trip")} onSubmit={(data) => updateTrip(activeTrip.id, data)} />
      )}
      {session && view === "trip" && (
        <TripDetail trip={activeTrip} loading={loadingTrip} session={session} isAdmin={isAdmin} onBack={() => { setView("home"); loadTrips(); }} onAddExpense={addExpense} onDeleteExpense={deleteExpense} onDeleteTrip={deleteTrip} onEdit={() => setView("edit")} />
      )}
      {session && view === "people" && isAdmin && <PeoplePanel onBack={() => setView("home")} />}
      {session && view === "deleted" && isAdmin && <DeletedTripsPanel onBack={() => { setView("home"); loadTrips(); }} />}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  async function getAccounts() {
    try {
      const res = await window.storage.get("accounts", true);
      return res ? JSON.parse(res.value) : {};
    } catch { return {}; }
  }

  async function handleSubmit() {
    const cleanName = name.trim();
    if (!cleanName) return setFormError("Enter your name.");
    if (!/^\d{4,6}$/.test(pin)) return setFormError("PIN should be 4 to 6 digits.");
    setFormError("");
    setBusy(true);
    try {
      const accounts = await getAccounts();
      const key = cleanName.toLowerCase();

      if (mode === "create") {
        if (accounts[key]) { setBusy(false); return setFormError("That name is already taken. Log in instead, or pick another name."); }
        if (pin !== pin2) { setBusy(false); return setFormError("PINs don't match."); }
        // The very first account ever created on a fresh app becomes admin.
        const isFirstEver = Object.keys(accounts).length === 0;
        const role = isFirstEver ? "admin" : "member";
        accounts[key] = { name: cleanName, pin: simpleHash(pin), role, joinedAt: new Date().toISOString() };
        await window.storage.set("accounts", JSON.stringify(accounts), true);
        await onLogin(cleanName, role);
      } else {
        const acct = accounts[key];
        if (!acct) { setBusy(false); return setFormError("No account with that name yet. Create one instead."); }
        if (acct.pin !== simpleHash(pin)) { setBusy(false); return setFormError("Wrong PIN."); }
        // One-time migration for accounts created before roles existed:
        // whoever logs into a role-less account first, while nobody yet
        // holds the admin role, becomes the admin.
        if (!acct.role) {
          const hasAdmin = Object.values(accounts).some((a) => a.role === "admin");
          acct.role = hasAdmin ? "member" : "admin";
          acct.joinedAt = acct.joinedAt || new Date().toISOString();
          accounts[key] = acct;
          await window.storage.set("accounts", JSON.stringify(accounts), true);
        }
        await onLogin(acct.name, acct.role);
      }
    } catch {
      setFormError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 340, margin: "16px auto" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--coral)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 0 #C9532F" }}>
          <Plane size={26} color="#fff" />
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--teal)", fontWeight: 700, marginBottom: 4 }}>GROUP TRAVEL EXPENSES</div>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 25, margin: 0, fontWeight: 700 }}>Tour Ledger</h1>
      </div>

      <div style={{ display: "flex", background: "var(--panel-soft)", border: "1.5px solid var(--border)", borderRadius: 10, padding: 3, marginBottom: 18 }}>
        {["login", "create"].map((m) => (
          <button key={m} onClick={() => { setMode(m); setFormError(""); }} style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: mode === m ? "var(--plum)" : "transparent", color: mode === m ? "#fff" : "var(--text-dim)" }}>
            {m === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="tl-label">Your name</label>
          <input className="tl-input" placeholder="Priya" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="tl-label">{mode === "create" ? "Choose a PIN (4 to 6 digits)" : "PIN"}</label>
          <input className="tl-input" type="password" inputMode="numeric" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
        </div>
        {mode === "create" && (
          <div>
            <label className="tl-label">Confirm PIN</label>
            <input className="tl-input" type="password" inputMode="numeric" placeholder="••••" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} />
          </div>
        )}
        {formError && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{formError}</p>}
        <button className="tl-btn" onClick={handleSubmit} disabled={busy} style={{ width: "100%", marginTop: 4 }}>
          {busy ? "Please wait…" : mode === "create" ? "Create account" : "Log in"}
        </button>
        <p style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", margin: 0 }}>
          Each name keeps its own PIN, so expenses always show who really logged them.
        </p>
      </div>
    </div>
  );
}

function Home({ trips, loading, onOpen, onNew, session, isAdmin, onLogout, onOpenPeople, onOpenDeleted }) {
  const visibleTrips = isAdmin ? trips : trips.filter((t) => (t.travelers || []).includes(session.name));

  return (
    <div>
      <div className="tl-row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--teal)", fontWeight: 700, marginBottom: 4 }}>GROUP TRAVEL EXPENSES</div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 25, margin: 0, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Plane size={22} color="var(--coral)" /> Tour Ledger
          </h1>
        </div>
        {isAdmin && <button className="tl-btn" onClick={onNew}><Plus size={16} /> New tour</button>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, flexWrap: "wrap", gap: 8 }}>
        <span style={{ color: "var(--text-dim)" }}>
          Logged in as <strong style={{ color: "var(--text)" }}>{session.name}</strong>
          {isAdmin && <span className="tl-chip" style={{ marginLeft: 8, color: "var(--plum)", borderColor: "var(--plum)" }}><ShieldCheck size={11} /> Admin</span>}
        </span>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: "var(--plum)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
          <LogOut size={13} /> Log out
        </button>
      </div>

      {isAdmin && (
        <div className="tl-row" style={{ marginBottom: 20 }}>
          <button className="tl-btn tl-btn-ghost" onClick={onOpenPeople}><UserCog size={14} /> People</button>
          <button className="tl-btn tl-btn-ghost" onClick={onOpenDeleted}><Archive size={14} /> Deleted tours</button>
        </div>
      )}

      {loading && <p style={{ color: "var(--text-dim)" }}>Loading tours…</p>}

      {!loading && visibleTrips.length === 0 && (
        <div style={{ border: "2px dashed var(--border)", borderRadius: 14, padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", background: "var(--panel)" }}>
          <Sparkles size={28} style={{ marginBottom: 10, color: "var(--gold)" }} />
          <p style={{ margin: "0 0 4px", color: "var(--text)", fontWeight: 700 }}>{isAdmin ? "No tours yet" : "No tours yet"}</p>
          <p style={{ margin: 0, fontSize: 13 }}>{isAdmin ? "Create one and add the people going." : "You'll see a tour here once the admin adds you to one."}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleTrips.map((t) => (
          <div key={t.id} onClick={() => onOpen(t.id)} style={{ background: "var(--panel)", border: "1.5px solid var(--border)", borderLeft: "5px solid var(--coral)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, boxShadow: "0 2px 6px rgba(43,33,24,0.05)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, fontWeight: 700 }}>{t.destination}</span>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span><CalendarDays size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{fmtDate(t.startDate)} → {fmtDate(t.endDate)}</span>
                <span><Users size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{t.numPeople} traveling</span>
              </div>
            </div>
            <div style={{ color: "var(--coral)", fontSize: 20, fontWeight: 700 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TravelerPicker({ selected, onChange }) {
  const [accounts, setAccounts] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("accounts", true);
        setAccounts(res ? JSON.parse(res.value) : {});
      } catch {
        setAccounts({});
      }
    })();
  }, []);

  function toggle(name) {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }

  if (accounts === null) return <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Loading people…</p>;

  const names = Object.values(accounts).map((a) => a.name).sort((a, b) => a.localeCompare(b));

  if (names.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Nobody has created an account yet.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {names.map((name) => (
        <label key={name} className="tl-check">
          <input type="checkbox" checked={selected.includes(name)} onChange={() => toggle(name)} />
          {name}
        </label>
      ))}
    </div>
  );
}

function TripForm({ mode, trip, onCancel, onSubmit }) {
  const isEdit = mode === "edit";
  const [destination, setDestination] = useState(isEdit ? trip.destination : "");
  const [startDate, setStartDate] = useState(isEdit ? trip.startDate : "");
  const [endDate, setEndDate] = useState(isEdit ? trip.endDate : "");
  const [placeInput, setPlaceInput] = useState("");
  const [places, setPlaces] = useState(isEdit ? trip.places || [] : []);
  const [numPeople, setNumPeople] = useState(isEdit ? trip.numPeople : 2);
  const [travelers, setTravelers] = useState(isEdit ? trip.travelers || [] : []);
  const [status, setStatus] = useState(isEdit ? trip.status || "Pending" : "Pending");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function addPlace() { const v = placeInput.trim(); if (v && !places.includes(v)) setPlaces([...places, v]); setPlaceInput(""); }

  async function handleSubmit() {
    if (!destination.trim()) return setFormError("Enter where you're going.");
    if (!startDate || !endDate) return setFormError("Enter both dates.");
    if (endDate < startDate) return setFormError("Return date is before the departure date.");
    if (!numPeople || numPeople < 1) return setFormError("Enter how many people are going.");
    setFormError("");
    setSubmitting(true);
    await onSubmit({ destination: destination.trim(), startDate, endDate, places, numPeople: Number(numPeople), travelers, status });
    setSubmitting(false);
  }

  return (
    <div>
      <button className="tl-btn tl-btn-ghost" onClick={onCancel} style={{ marginBottom: 18 }}><ArrowLeft size={15} /> Back</button>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 21, margin: "0 0 18px", display: "flex", alignItems: "center", gap: 8 }}>
        {isEdit ? <Pencil size={20} color="var(--plum)" /> : <Compass size={20} color="var(--plum)" />}
        {isEdit ? "Edit tour" : "Plan a new tour"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="tl-label">Where are you going</label>
          <input className="tl-input" placeholder="Kerala backwaters" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>

        <div className="tl-row">
          <div style={{ flex: "1 1 140px" }}>
            <label className="tl-label">Departs</label>
            <input type="date" className="tl-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label className="tl-label">Returns</label>
            <input type="date" className="tl-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="tl-label">Status</label>
          <select className="tl-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200 }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="tl-label">Places you'll visit</label>
          <div className="tl-row">
            <input className="tl-input" style={{ flex: "1 1 160px" }} placeholder="Alleppey" value={placeInput} onChange={(e) => setPlaceInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPlace())} />
            <button type="button" className="tl-btn tl-btn-teal" onClick={addPlace}>Add</button>
          </div>
          {places.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {places.map((p) => (
                <span key={p} className="tl-chip"><MapPin size={11} /> {p}<X size={12} style={{ cursor: "pointer" }} onClick={() => setPlaces(places.filter((x) => x !== p))} /></span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="tl-label">How many people are going</label>
          <input type="number" min="1" className="tl-input" style={{ maxWidth: 120 }} value={numPeople} onChange={(e) => setNumPeople(e.target.value)} />
        </div>

        <div>
          <label className="tl-label">Who's going (only people who've created an account can be added)</label>
          <TravelerPicker selected={travelers} onChange={setTravelers} />
        </div>

        {formError && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{formError}</p>}
        <button className="tl-btn" onClick={handleSubmit} disabled={submitting} style={{ alignSelf: "flex-start" }}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create tour"}
        </button>
      </div>
    </div>
  );
}

function DeleteTripModal({ trip, onCancel, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const canConfirm = confirmText.trim().toLowerCase() === trip.destination.trim().toLowerCase();

  async function handleConfirm() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(43,33,24,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 22, width: "100%", maxWidth: 340 }}>
        <h3 style={{ fontFamily: "'Poppins', sans-serif", margin: "0 0 6px", fontSize: 17, color: "var(--danger)" }}>Delete this tour?</h3>
        <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 14px" }}>
          It'll move to Deleted tours, where it can still be viewed or restored. Type the tour's destination to confirm.
        </p>
        <input className="tl-input" placeholder={trip.destination} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button className="tl-btn tl-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="tl-btn tl-btn-danger" onClick={handleConfirm} disabled={!canConfirm || busy}>
            {busy ? "Deleting…" : "Delete tour"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TripDetail({ trip, loading, session, isAdmin, onBack, onAddExpense, onDeleteExpense, onDeleteTrip, onEdit }) {
  const [showDeleteTrip, setShowDeleteTrip] = useState(false);

  if (loading || !trip) {
    return (
      <div>
        <button className="tl-btn tl-btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}><ArrowLeft size={15} /> Back</button>
        <p style={{ color: "var(--text-dim)" }}>Loading tour…</p>
      </div>
    );
  }

  const totals = useMemoTotals(trip.expenses);
  const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <button className="tl-btn tl-btn-ghost" onClick={onBack}><ArrowLeft size={15} /> Back to tours</button>
        {isAdmin && (
          <div className="tl-row" style={{ gap: 14 }}>
            <button onClick={onEdit} style={{ background: "none", border: "none", color: "var(--plum)", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <Pencil size={14} /> Edit tour
            </button>
            <button onClick={() => setShowDeleteTrip(true)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <Trash2 size={14} /> Delete tour
            </button>
          </div>
        )}
      </div>

      {showDeleteTrip && <DeleteTripModal trip={trip} onCancel={() => setShowDeleteTrip(false)} onConfirm={() => onDeleteTrip(trip.id)} />}

      <TicketHeader trip={trip} />

      <div className="tl-row" style={{ margin: "20px 0" }}>
        <div style={{ flex: "1 1 160px", background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
          <div className="tl-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><Wallet size={12} color="var(--plum)" /> Total spent</div>
          <SplitFlap value={total} />
        </div>
        <div style={{ flex: "1 1 160px", background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
          <div className="tl-label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><Receipt size={12} color="var(--teal)" /> Expenses logged</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--teal)" }}>{trip.expenses.length}</div>
        </div>
      </div>

      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, margin: "24px 0 10px" }}>Who's in this tour</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
        {(trip.travelers || []).length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nobody's been added yet.</p>
        ) : (
          trip.travelers.map((p) => (
            <span key={p} className="tl-chip" style={{ color: "var(--plum)", borderColor: "var(--plum)" }}>{p}</span>
          ))
        )}
      </div>

      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, margin: "24px 0 10px" }}>Who's spent what</h3>
      {totals.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No expenses logged yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {totals.map(([person, amt]) => (
            <div key={person} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontWeight: 700 }}>{person}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--coral)", fontWeight: 700 }}>{fmt(amt)}</span>
            </div>
          ))}
        </div>
      )}

      <AddExpenseForm trip={trip} session={session} onAdd={onAddExpense} />

      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16, margin: "24px 0 10px" }}>All expenses</h3>
      {trip.expenses.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nothing logged yet. Add the first expense above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {trip.expenses.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 13, gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <CategoryIcon category={e.category} />
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontWeight: 700 }}>{e.description || e.category}</span>
                  <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{e.person} · {e.category} · {fmtDate(e.date)}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{fmt(e.amount)}</span>
                {(e.person === session.name || isAdmin) && (
                  <Trash2 size={16} style={{ color: "var(--danger)", cursor: "pointer" }} onClick={() => onDeleteExpense(e.id)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function useMemoTotals(expenses) {
  return useMemo(() => {
    const map = {};
    for (const e of expenses) { const p = e.person || "Unnamed"; map[p] = (map[p] || 0) + Number(e.amount || 0); }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
}

function TicketHeader({ trip }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #FFF6ED 0%, #FDEFFB 100%)", color: "var(--text)", borderRadius: 14, padding: "18px 20px", border: "2px dashed #E3C9E8" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, color: "var(--plum)", display: "flex", alignItems: "center", gap: 5 }}>
          <Plane size={12} /> TOUR PASS
        </div>
        <StatusBadge status={trip.status} />
      </div>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 23, fontWeight: 700, marginBottom: 10 }}>{trip.destination}</div>
      <div className="tl-row" style={{ gap: 22 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 700 }}>DEPARTS</div>
          <div style={{ fontWeight: 700 }}>{fmtDate(trip.startDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 700 }}>RETURNS</div>
          <div style={{ fontWeight: 700 }}>{fmtDate(trip.endDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--text-dim)", fontWeight: 700 }}>TRAVELERS</div>
          <div style={{ fontWeight: 700 }}>{trip.numPeople}</div>
        </div>
      </div>
      {trip.places && trip.places.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {trip.places.map((p) => (
            <span key={p} style={{ fontSize: 11, background: "rgba(138,92,176,0.12)", color: "var(--plum)", borderRadius: 20, padding: "4px 10px", fontWeight: 700 }}>
              <MapPin size={10} style={{ verticalAlign: -1, marginRight: 3 }} />{p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AddExpenseForm({ trip, session, onAdd }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) return setFormError("Enter an amount.");
    if (!description.trim()) return setFormError("Say what it was for.");
    setFormError("");
    setSubmitting(true);
    await onAdd({ person: session.name, amount: Number(amount), description: description.trim(), category, date });
    setAmount(""); setDescription("");
    setSubmitting(false);
  }

  return (
    <div style={{ background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 16, marginTop: 20 }}>
      <div className="tl-label" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
        <Receipt size={13} color="var(--coral)" /> Log an expense as {session.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="tl-row">
          <div style={{ flex: "1 1 140px" }}>
            <label className="tl-label">Date</label>
            <input type="date" className="tl-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label className="tl-label">Category</label>
            <select className="tl-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="tl-label">What was it for</label>
          <input className="tl-input" placeholder="Houseboat lunch" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="tl-label">Amount</label>
          <input type="number" min="0" step="0.01" className="tl-input" style={{ maxWidth: 180 }} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        {formError && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{formError}</p>}
        <button className="tl-btn" onClick={handleSubmit} disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Saving…" : "Add expense"}
        </button>
      </div>
    </div>
  );
}

function PeoplePanel({ onBack }) {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("accounts", true);
        setAccounts(res ? JSON.parse(res.value) : {});
      } catch {
        setError("Couldn't load the list of people.");
        setAccounts({});
      }
    })();
  }, []);

  const list = accounts ? Object.values(accounts).sort((a, b) => (a.joinedAt || "").localeCompare(b.joinedAt || "")) : [];

  return (
    <div>
      <button className="tl-btn tl-btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}><ArrowLeft size={15} /> Back</button>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 21, margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <UserCog size={20} color="var(--plum)" /> People
      </h2>
      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {accounts === null ? (
        <p style={{ color: "var(--text-dim)" }}>Loading…</p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16 }}>
            <strong style={{ color: "var(--text)" }}>{list.length}</strong> {list.length === 1 ? "person has" : "people have"} created an account using this link.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map((a) => (
              <div key={a.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 14px" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.name}</div>
                  {a.joinedAt && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Joined {fmtDate(a.joinedAt.slice(0, 10))}</div>}
                </div>
                {a.role === "admin" ? (
                  <span className="tl-chip" style={{ color: "var(--plum)", borderColor: "var(--plum)" }}><ShieldCheck size={11} /> Admin</span>
                ) : (
                  <span className="tl-chip">Member</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeletedTripsPanel({ onBack }) {
  const [deleted, setDeleted] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const res = await window.storage.get("deleted-trips-index", true);
      setDeleted(res ? JSON.parse(res.value) : []);
    } catch {
      setError("Couldn't load deleted tours.");
      setDeleted([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function restore(entry) {
    setBusyId(entry.id);
    try {
      const activeRes = await window.storage.get("trips-index", true);
      const active = activeRes ? JSON.parse(activeRes.value) : [];
      const { deletedAt, ...clean } = entry;
      await window.storage.set("trips-index", JSON.stringify([clean, ...active]), true);

      const newDeleted = deleted.filter((d) => d.id !== entry.id);
      await window.storage.set("deleted-trips-index", JSON.stringify(newDeleted), true);
      setDeleted(newDeleted);
    } catch {
      setError("Couldn't restore that tour.");
    }
    setBusyId(null);
  }

  async function purge(entry) {
    setBusyId(entry.id);
    try {
      await window.storage.delete(`trip:${entry.id}`, true);
      const newDeleted = deleted.filter((d) => d.id !== entry.id);
      await window.storage.set("deleted-trips-index", JSON.stringify(newDeleted), true);
      setDeleted(newDeleted);
    } catch {
      setError("Couldn't permanently delete that tour.");
    }
    setBusyId(null);
  }

  return (
    <div>
      <button className="tl-btn tl-btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}><ArrowLeft size={15} /> Back</button>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 21, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Archive size={20} color="var(--plum)" /> Deleted tours
      </h2>
      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
      {deleted === null ? (
        <p style={{ color: "var(--text-dim)" }}>Loading…</p>
      ) : deleted.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nothing here. Deleted tours will show up in this list.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {deleted.map((t) => (
            <div key={t.id} style={{ background: "var(--panel)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 16 }}>{t.destination}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                    {fmtDate(t.startDate)} → {fmtDate(t.endDate)} · Deleted {t.deletedAt ? fmtDate(t.deletedAt.slice(0, 10)) : ""}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="tl-row" style={{ marginTop: 12 }}>
                <button className="tl-btn tl-btn-teal" onClick={() => restore(t)} disabled={busyId === t.id}>
                  <RotateCcw size={14} /> Restore
                </button>
                <button className="tl-btn tl-btn-danger" onClick={() => purge(t)} disabled={busyId === t.id}>
                  <Trash2 size={14} /> Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
