import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { color, space } from "@acquisition-os/design-tokens";
import { CommandCenterFrame } from "@acquisition-os/product-frames";
import { Button } from "@acquisition-os/ui";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  status: string;
};

/**
 * Sprint 1 shell — session auth against apps/api.
 * Layout unchanged from Sprint 0; Sign in enables login/logout only.
 * Owner: Frontend Lead · Reviewer: Security Engineer
 */
export function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [email, setEmail] = useState("demo@acquisition-os.local");
  const [password, setPassword] = useState("ChangeMe-Demo-Only-1!");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const body = (await res.json()) as { user: SessionUser };
        if (!cancelled) setUser(body.user);
      } catch {
        /* API may be down during static preview */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as { user?: SessionUser; error?: { message: string } };
      if (!res.ok) {
        setError(body.error?.message ?? "Sign in failed.");
        return;
      }
      setUser(body.user ?? null);
      setShowForm(false);
    } catch {
      setError("Unable to reach API. Is @acquisition-os/api running?");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.bgApp,
        color: color.fgPrimary,
        padding: space[6],
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: space[6],
          gap: space[4],
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: color.accent,
            }}
          >
            Acquisition OS
          </p>
          <h1 style={{ margin: `${space[2]}px 0 0`, fontSize: 24, fontWeight: 600 }}>
            Command Center
          </h1>
          {user ? (
            <p style={{ margin: `${space[2]}px 0 0`, fontSize: 13, color: color.fgSecondary }}>
              Signed in as {user.email}
            </p>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: space[3], alignItems: "center" }}>
          {user ? (
            <Button type="button" onClick={() => void onLogout()} disabled={busy}>
              Sign out
            </Button>
          ) : (
            <Button type="button" onClick={() => setShowForm((v) => !v)} disabled={busy}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      {showForm && !user ? (
        <form
          onSubmit={(e) => void onLogin(e)}
          style={{
            marginBottom: space[6],
            maxWidth: 360,
            display: "grid",
            gap: space[3],
          }}
        >
          <label style={{ display: "grid", gap: space[1], fontSize: 13 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: space[1], fontSize: 13 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </label>
          {error ? (
            <p style={{ margin: 0, color: color.danger, fontSize: 13 }} role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Continue"}
          </Button>
        </form>
      ) : null}

      <CommandCenterFrame />
    </div>
  );
}

const inputStyle: CSSProperties = {
  padding: `${space[2]}px ${space[3]}px`,
  border: `1px solid ${color.borderDefault}`,
  borderRadius: 4,
  background: color.bgElevated,
  color: color.fgPrimary,
  fontSize: 14,
};
