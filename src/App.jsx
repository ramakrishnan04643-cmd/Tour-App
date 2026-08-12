import React, { useState, useEffect, useMemo } from "react";
import { Plus, ArrowLeft, Trash2, MapPin, Calendar, Users, Receipt, X, Luggage, LogOut } from "lucide-react";

// Fallback for storage API
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
    },
    delete: async (key) => {
      localStorage.removeItem(key);
    },
  };
}

const CATEGORIES = ["Stay", "Food", "Transport", "Activity", "Other"];

const fmt = (n) =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function SplitFlap({ value, prefix = "" }) {
  const digits = (prefix + fmt(value)).split("");
  return (
    <div style={{ display: "inline-flex", gap: 3 }}>
      {digits.map((ch, i) => (
        <span
          key={i}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "var(--panel-light)",
            color: "var(--gold)",
            border: "1px solid var(--border)",
            borderRadius: 3,
            padding: ch === "." || ch === "," ? "6px 2px" : "6px 7px",
            fontSize: 22,
            fontWeight: 700,
            minWidth: ch === "." || ch === "," ? 6 : 18,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
    :root {
      --ink: #16211C;
      --panel: #1D2B24;
      --panel-light: #26392F;
      --paper: #F2ECDB;
      --paper-ink: #2B2417;
      --gold: #DDA94E;
      --gold-dim: #B0842F;
      --sage: #82B79C;
      --coral: #D97456;
      --text: #ECE7D8;
      --text-dim: #96A79A;
      --border: #34493D;
    }
    .tl-btn {
      font-family: 'IBM Plex Sans', sans-serif;
      background: var(--gold);
      color: #241804;
      border: 1px solid var(--gold);
      border-radius: 8px;
      padding: 11px 18px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .tl-btn:hover { background: #eab765; border-color: #eab765; }
    .tl-btn:disabled { opacity: 0.6; cursor: default; }
    .tl-btn-ghost {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .tl-btn-ghost:hover { background: var(--panel-light); }
    .tl-input, .tl-select {
      font-family: 'IBM Plex Sans', sans-serif;
      background: var(--panel-light);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 6px;
      padding: 10px;
      font-size: 14px;
      width: 100%;
      box-sizing: border-box;
      color-scheme: dark;
    }
    .tl-input::placeholder { color: var(--text-dim); }
    .tl-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-dim);
      font-weight: 600;
      display: block;
      margin-bottom: 6px;
    }
    .tl-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--panel-light);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 12px;
      color: var(--text-dim);
    }
  `}</style>
);

export default function App() {
  const [session, setSession] = useState(undefined);
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [view, setView] = useState("home");
  const [activeTrip, setActiveTrip] = useState(null);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (session) loadTrips();
  }, [session]);

  async function restoreSession() {
    try {
      const res = await window.storage.get("session");
      setSession(res ? JSON.parse(res.value) : null);
    } catch {
      setSession(null);
    }
  }

  async function loadTrips() {
    setLoadingTrips(true);
    try {
      const res = await window.storage.get("trips-index");
      setTrips(res ? JSON.parse(res.value) : []);
    } catch {
      setTrips([]);
    }
    setLoadingTrips(false);
  }

  async function handleLogin(name) {
    const s = { name };
    try {
      await window.storage.set("session", JSON.stringify(s));
    } catch {}
    setSession(s);
  }

  async function handleLogout() {
    try {
      await window.storage.delete("session");
    } catch {}
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
      createdAt: new Date().toISOString(),
      expenses: [],
    };
    try {
      await window.storage.set(`trip:${id}`, JSON.stringify(trip));
      const summary = {
        id,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        numPeople: trip.numPeople,
        createdAt: trip.createdAt,
      };
      const newIndex = [summary, ...trips];
      await window.storage.set("trips-index", JSON.stringify(newIndex));
      setTrips(newIndex);
      setActiveTrip(trip);
      setView("trip");
    } catch {
      setError("Couldn't create the tour. Try again.");
    }
  }

  async function openTrip(id) {
    setLoadingTrip(true);
    setView("trip");
    try {
      const res = await window.storage.get(`trip:${id}`);
      setActiveTrip(res ? JSON.parse(res.value) : null);
    } catch {
      setError("Couldn't load that tour.");
    }
    setLoadingTrip(false);
  }

  async function saveActiveTrip(updated) {
    setActiveTrip(updated);
    try {
      await window.storage.set(`trip:${updated.id}`, JSON.stringify(updated));
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

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: "var(--ink)",
        color: "var(--text)",
        minHeight: "100vh",
        padding: "28px 20px 40px",
        boxSizing: "border-box",
      }}
    >
      <GlobalStyle />

      {error && (
        <div
          style={{
            background: "rgba(217,116,86,0.15)",
            border: "1px solid var(--coral)",
            color: "#F3C6B6",
            padding: "10px 14px",
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{error}</span>
          <X size={16} style={{ cursor: "pointer" }} onClick={() => setError("")} />
        </div>
      )}

      {session === undefined && <p style={{ color: "var(--text-dim)" }}>Loading…</p>}

      {session === null && <LoginScreen onLogin={handleLogin} />}

      {session && view === "home" && (
        <Home trips={trips} loading={loadingTrips} onOpen={openTrip} onNew={() => setView("new")} session={session} onLogout={handleLogout} />
      )}

      {session && view === "new" && <NewTripForm onCancel={() => setView("home")} onCreate={createTrip} />}

      {session && view === "trip" && (
        <TripDetail
          trip={activeTrip}
          loading={loadingTrip}
          session={session}
          onBack={() => {
            setView("home");
            loadTrips();
          }}
          onAddExpense={addExpense}
          onDeleteExpense={deleteExpense}
        />
      )}
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
      const res = await window.storage.get("accounts");
      return res ? JSON.parse(res.value) : {};
    } catch {
      return {};
    }
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
        if (accounts[key]) {
          setBusy(false);
          return setFormError("That name is already taken. Log in instead, or pick another name.");
        }
        if (pin !== pin2) {
          setBusy(false);
          return setFormError("PINs don't match.");
        }
        accounts[key] = { name: cleanName, pin: simpleHash(pin) };
        await window.storage.set("accounts", JSON.stringify(accounts));
        await onLogin(cleanName);
      } else {
        const acct = accounts[key];
        if (!acct) {
          setBusy(false);
          return setFormError("No account with that name yet. Create one instead.");
        }
        if (acct.pin !== simpleHash(pin)) {
          setBusy(false);
          return setFormError("Wrong PIN.");
        }
        await onLogin(acct.name);
      }
    } catch {
      setFormError("Something went wrong. Try again.");
    }
    setBusy(false);
  }

  return (
    <div style={{ maxWidth: 320, margin: "20px auto" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>
          GROUP TRAVEL EXPENSES
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, margin: 0, fontWeight: 700 }}>Tour ledger</h1>
      </div>

      <div style={{ display: "flex", background: "var(--panel-light)", borderRadius: 8, padding: 3, marginBottom: 18 }}>
        {["login", "create"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setFormError("");
            }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: mode === m ? "var(--gold)" : "transparent",
              color: mode === m ? "#241804" : "var(--text-dim)",
            }}
          >
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
          <input
            className="tl-input"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {mode === "create" && (
          <div>
            <label className="tl-label">Confirm PIN</label>
            <input
              className="tl-input"
              type="password"
              inputMode="numeric"
              placeholder="••••"
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        )}

        {formError && <p style={{ color: "var(--coral)", fontSize: 13, margin: 0 }}>{formError}</p>}

        <button className="tl-btn" onClick={handleSubmit} disabled={busy} style={{ width: "100%", marginTop: 4 }}>
          {busy ? "Please wait…" : mode === "create" ? "Create account" : "Log in"}
        </button>
      </div>
    </div>
  );
}

function Home({ trips, loading, onOpen, onNew, session, onLogout }) {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>
            GROUP TRAVEL EXPENSES
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, margin: 0, fontWeight: 700 }}>Tour ledger</h1>
        </div>
        <button className="tl-btn" onClick={onNew}>
          <Plus size={16} /> New tour
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 20,
          fontSize: 13,
        }}
      >
        <span style={{ color: "var(--text-dim)" }}>
          Logged in as <strong style={{ color: "var(--text)" }}>{session.name}</strong>
        </span>
        <button
          onClick={onLogout}
          style={{ background: "none", border: "none", color: "var(--sage)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
        >
          <LogOut size={13} /> Log out
        </button>
      </div>

      {loading && <p style={{ color: "var(--text-dim)" }}>Loading tours…</p>}

      {!loading && trips.length === 0 && (
        <div style={{ border: "1px dashed var(--border)", borderRadius: 10, padding: "40px 20px", textAlign: "center", color: "var(--text-dim)" }}>
          <Luggage size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
          <p style={{ margin: "0 0 4px", color: "var(--text)", fontWeight: 500 }}>No tours yet</p>
          <p style={{ margin: 0, fontSize: 13 }}>Start one and everyone going can log what they spend.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {trips.map((t) => (
          <div
            key={t.id}
            onClick={() => onOpen(t.id)}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 16px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700 }}>{t.destination}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4, display: "flex", gap: 14 }}>
                <span>
                  <Calendar size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {fmtDate(t.startDate)} → {fmtDate(t.endDate)}
                </span>
                <span>
                  <Users size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                  {t.numPeople} traveling
                </span>
              </div>
            </div>
            <div style={{ color: "var(--gold)", fontSize: 18 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewTripForm({ onCancel, onCreate }) {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [placeInput, setPlaceInput] = useState("");
  const [places, setPlaces] = useState([]);
  const [numPeople, setNumPeople] = useState(2);
  const [travelerInput, setTravelerInput] = useState("");
  const [travelers, setTravelers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function addPlace() {
    const v = placeInput.trim();
    if (v && !places.includes(v)) setPlaces([...places, v]);
    setPlaceInput("");
  }
  function addTraveler() {
    const v = travelerInput.trim();
    if (v && !travelers.includes(v)) setTravelers([...travelers, v]);
    setTravelerInput("");
  }

  async function handleSubmit() {
    if (!destination.trim()) return setFormError("Enter where you're going.");
    if (!startDate || !endDate) return setFormError("Enter both dates.");
    if (endDate < startDate) return setFormError("Return date is before departure.");
    if (!numPeople || numPeople < 1) return setFormError("Enter how many people are going.");
    setFormError("");
    setSubmitting(true);
    await onCreate({ destination: destination.trim(), startDate, endDate, places, numPeople: Number(numPeople), travelers });
    setSubmitting(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <button className="tl-btn tl-btn-ghost" onClick={onCancel} style={{ marginBottom: 18 }}>
        <ArrowLeft size={15} /> Back
      </button>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 21, margin: "0 0 18px" }}>Plan a new tour</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="tl-label">Where are you going</label>
          <input className="tl-input" placeholder="Kerala backwaters" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="tl-label">Departs</label>
            <input type="date" className="tl-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="tl-label">Returns</label>
            <input type="date" className="tl-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="tl-label">Places you'll visit</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="tl-input"
              placeholder="Alleppey"
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPlace())}
            />
            <button type="button" className="tl-btn tl-btn-ghost" onClick={addPlace}>Add</button>
          </div>
          {places.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {places.map((p) => (
                <span key={p} className="tl-chip">
                  <MapPin size={11} /> {p}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => setPlaces(places.filter((x) => x !== p))} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="tl-label">How many people are going</label>
          <input type="number" min="1" className="tl-input" style={{ maxWidth: 120 }} value={numPeople} onChange={(e) => setNumPeople(e.target.value)} />
        </div>

        <div>
          <label className="tl-label">Traveler names (optional)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="tl-input"
              placeholder="Add a name"
              value={travelerInput}
              onChange={(e) => setTravelerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTraveler())}
            />
            <button type="button" className="tl-btn tl-btn-ghost" onClick={addTraveler}>Add</button>
          </div>
          {travelers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {travelers.map((p) => (
                <span key={p} className="tl-chip">
                  {p}
                  <X size={12} style={{ cursor: "pointer" }} onClick={() => setTravelers(travelers.filter((x) => x !== p))} />
                </span>
              ))}
            </div>
          )}
        </div>

        {formError && <p style={{ color: "var(--coral)", fontSize: 13, margin: 0 }}>{formError}</p>}

        <button className="tl-btn" onClick={handleSubmit} disabled={submitting} style={{ alignSelf: "flex-start" }}>
          {submitting ? "Creating…" : "Create tour"}
        </button>
      </div>
    </div>
  );
}

function TripDetail({ trip, loading, session, onBack, onAddExpense, onDeleteExpense }) {
  if (loading || !trip) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button className="tl-btn tl-btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <p style={{ color: "var(--text-dim)" }}>Loading tour…</p>
      </div>
    );
  }

  const totals = useMemoTotals(trip.expenses);
  const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <button className="tl-btn tl-btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>
        <ArrowLeft size={15} /> Back to tours
      </button>

      <TicketHeader trip={trip} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "20px 0" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div className="tl-label" style={{ marginBottom: 8 }}>Total spent</div>
          <SplitFlap value={total} />
        </div>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div className="tl-label" style={{ marginBottom: 8 }}>Expenses logged</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--sage)" }}>
            {trip.expenses.length}
          </div>
        </div>
      </div>

      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, margin: "24px 0 10px" }}>Who's spent what</h3>
      {totals.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No expenses logged yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {totals.map(([person, amt]) => (
            <div key={person} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontWeight: 500 }}>{person}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--gold)", fontWeight: 600 }}>{fmt(amt)}</span>
            </div>
          ))}
        </div>
      )}

      <AddExpenseForm trip={trip} session={session} onAdd={onAddExpense} />

      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, margin: "24px 0 10px" }}>All expenses</h3>
      {trip.expenses.length === 0 ? (
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nothing logged yet. Add the first expense above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {trip.expenses
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 500 }}>{e.description || e.category}</span>
                  <span style={{ color: "var(--text-dim)", fontSize: 12 }}>
                    {e.person} · {e.category} · {fmtDate(e.date)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{fmt(e.amount)}</span>
                  {e.person === session.name && (
                    <Trash2 size={15} style={{ color: "var(--coral)", cursor: "pointer" }} onClick={() => onDeleteExpense(e.id)} />
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
    for (const e of expenses) {
      const p = e.person || "Unnamed";
      map[p] = (map[p] || 0) + Number(e.amount || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
}

function TicketHeader({ trip }) {
  return (
    <div style={{ background: "var(--paper)", color: "var(--paper-ink)", borderRadius: 10, padding: "18px 20px", border: "1px dashed #c3b78f" }}>
      <div style={{ fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, opacity: 0.6, marginBottom: 4 }}>TOUR PASS</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 10 }}>{trip.destination}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6, fontWeight: 600 }}>DEPARTS</div>
          <div style={{ fontWeight: 500 }}>{fmtDate(trip.startDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6, fontWeight: 600 }}>RETURNS</div>
          <div style={{ fontWeight: 500 }}>{fmtDate(trip.endDate)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.6, fontWeight: 600 }}>TRAVELERS</div>
          <div style={{ fontWeight: 500 }}>{trip.numPeople}</div>
        </div>
      </div>
      {trip.places && trip.places.length > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {trip.places.map((p) => (
            <span key={p} style={{ fontSize: 11, background: "rgba(0,0,0,0.06)", borderRadius: 20, padding: "3px 9px", fontWeight: 500 }}>
              <MapPin size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
              {p}
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
    setAmount("");
    setDescription("");
    setSubmitting(false);
  }

  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginTop: 20 }}>
      <div className="tl-label" style={{ marginBottom: 10 }}>
        <Receipt size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
        Log an expense as {session.name}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label className="tl-label">Date</label>
            <input type="date" className="tl-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={{ width: 120 }}>
            <label className="tl-label">Category</label>
            <select className="tl-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="tl-label">What was it for</label>
          <input className="tl-input" placeholder="Houseboat lunch" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="tl-label">Amount</label>
          <input type="number" min="0" step="0.01" className="tl-input" style={{ maxWidth: 160 }} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        {formError && <p style={{ color: "var(--coral)", fontSize: 13, margin: 0 }}>{formError}</p>}

        <button className="tl-btn" onClick={handleSubmit} disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Saving…" : "Add expense"}
        </button>
      </div>
    </div>
  );
}