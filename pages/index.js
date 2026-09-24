import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import Router from "next/router";
import AdminPanel from "../components/AdminPanel";
import JudgePanel from "../components/JudgePanel";
import ResultsPanel from "../components/ResultsPanel";
import RoleChooser from "../components/RoleChooser";
import LoginForm from "../components/LoginForm";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";

const THEME_KEY = "judging_theme";
const THEMES = [
  { id: "system", icon: "contrast", label: "Match my device" },
  { id: "light", icon: "sun", label: "Light" },
  { id: "dark", icon: "moon", label: "Dark" },
];

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export default function Home() {
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [authView, setAuthView] = useState("choose");
  const [tab, setTab] = useState("admin");
  const [participantId, setParticipantId] = useState("");
  const [expandedResult, setExpandedResult] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [theme, setTheme] = useState("system");
  const [scrolled, setScrolled] = useState(false);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState(null);

  // ---- theme ----

  useEffect(() => {
    let stored = "system";
    try {
      stored = window.localStorage.getItem(THEME_KEY) || "system";
    } catch (e) {
      stored = "system";
    }
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function cycleTheme() {
    const next = THEMES[(THEMES.findIndex((t) => t.id === theme) + 1) % THEMES.length].id;
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* per-viewer convenience only */
    }
  }

  // ---- the title bar only grows a hairline once content is behind it ----

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---- data ----

  // A failed load keeps the last good state. Storing the error body as state
  // crashed every screen that reads judges/participants from it, so one bad
  // response during the event took the whole page down.
  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data.judges) || !Array.isArray(data.participants)) {
        setError(`${data.error || "The server could not load the scoresheet."} Retrying…`);
        return;
      }
      setState(data);
      setError(null);
    } catch (e) {
      setError("Could not reach the server. Retrying…");
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data.session);
      setWarnings(data.warnings || null);
      return data.session;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadSession(), loadState()]);
      setBooted(true);
    })();
  }, [loadSession, loadState]);

  useEffect(() => {
    // Signed-out screens poll only while recovering from a failed load, so the
    // judge name list fills in once the server is reachable again.
    if (!session && !error) return undefined;
    const interval = setInterval(loadState, 6000);
    return () => clearInterval(interval);
  }, [session, error, loadState]);

  async function handleSignedIn(newSession) {
    setSession(newSession);
    setParticipantId("");
    setExpandedResult(null);
    setTab("admin");
    await Promise.all([loadSession(), loadState()]);
  }

  // The screen changes first and the cookie is cleared after: on a slow venue
  // network, waiting on the request made sign-out look like it had frozen.
  async function signOut() {
    setSession(null);
    setWarnings(null);
    setAuthView("choose");
    setParticipantId("");
    setExpandedResult(null);
    setConfirmSignOut(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      /* the cookie expires on its own; the UI is already signed out */
    }
    await loadState();
  }

  async function patchState(patch) {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) await signOut();
      throw new Error(data.error || "Could not save changes.");
    }
    setState(data);
    return data;
  }

  async function submitScore(pid, scores) {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: pid, scores }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) await signOut();
      throw new Error(data.error || "Could not save that score.");
    }
    setState((s) => ({ ...s, scores: { ...s.scores, [data.key]: data.entry } }));
  }

  const eventName = state ? state.eventName : "Judging Scoresheet";
  const isAdmin = session && session.role === "admin";
  const isJudge = session && session.role === "judge";
  const participant =
    state && participantId ? state.participants.find((p) => p.id === participantId) : null;

  // ---- navigation ----
  //
  // Back steps up exactly one level rather than jumping to the start, and the
  // label names the screen it returns to. Leaving a role signs you out, so
  // that step confirms first.

  function resolveBack() {
    if (!session) {
      if (authView === "choose") return null;
      return { label: "Roles", run: () => setAuthView("choose") };
    }
    const signOutStep = { label: "Roles", signOut: true, run: () => setConfirmSignOut(true) };
    if (isJudge) {
      if (participantId) return { label: "Participants", run: () => setParticipantId("") };
      return signOutStep;
    }
    if (tab === "results") {
      if (expandedResult) return { label: "Results", run: () => setExpandedResult(null) };
      return { label: "Setup", run: () => setTab("admin") };
    }
    return signOutStep;
  }

  const back = resolveBack();
  const canGoBack = Boolean(back);
  const backRef = useRef(null);
  backRef.current = back;

  // The hardware/browser Back gesture is caught with a guard history entry so
  // it steps up a level instead of leaving the app. This is a single-route
  // app, so Next's own router is told to ignore those pops.
  useEffect(() => {
    Router.beforePopState(() => false);
    function onPopState() {
      if (backRef.current) backRef.current.run();
    }
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      Router.beforePopState(() => true);
    };
  }, []);

  useEffect(() => {
    if (!canGoBack) return;
    const armed = Boolean(window.history.state && window.history.state.judgingGuard);
    if (!armed) window.history.pushState({ judgingGuard: true }, "");
  });

  // On-screen controls act immediately. Routing them through history.back()
  // and waiting for popstate made the sign-out prompt slow to appear on iPad
  // Safari, and it never appeared when WebKit skipped the guard entry.
  function goBack() {
    if (back) back.run();
  }

  // ---- titles ----

  let title = eventName;
  let subtitle = null;

  if (!session) {
    if (authView === "judge") {
      title = "Judge sign-in";
      subtitle = eventName;
    } else if (authView === "admin") {
      title = "Organizer sign-in";
      subtitle = eventName;
    } else {
      subtitle = "Live scoring and automatic tally";
    }
  } else if (isJudge) {
    if (participant) {
      const index = state.participants.findIndex((p) => p.id === participantId);
      title = participant.name;
      subtitle = participant.team
        ? `${participant.team} · ${index + 1} of ${state.participants.length}`
        : `${index + 1} of ${state.participants.length}`;
    } else {
      title = "Score";
      subtitle = `Judging as ${session.judgeName}`;
    }
  } else {
    title = tab === "results" ? "Results" : "Setup";
    subtitle = eventName;
  }

  const themeMeta = THEMES.find((t) => t.id === theme) || THEMES[0];
  const wide = isAdmin ? " wide" : "";

  return (
    <>
      <Head>
        <title>{eventName}</title>
      </Head>

      <div className="app">
        <div className={`nav ${scrolled ? "scrolled" : ""}`}>
          <div className={`nav-inner${wide}`}>
            <span className="nav-side">
              {back && !back.signOut && (
                <button className="nav-back" onClick={goBack}>
                  <Icon name="chevronLeft" size={22} />
                  <span>{back.label}</span>
                </button>
              )}
            </span>

            <span className="nav-title">{title}</span>

            <span className="nav-side end">
              {session && (
                <button className="nav-signout" onClick={() => setConfirmSignOut(true)}>
                  <Icon name="signOut" size={18} />
                  <span>Sign out</span>
                </button>
              )}
              <button
                className="nav-action"
                onClick={cycleTheme}
                aria-label={`Appearance: ${themeMeta.label}. Tap to change.`}
                title={`Appearance: ${themeMeta.label}`}
              >
                <Icon name={themeMeta.icon} size={21} />
              </button>
            </span>
          </div>
        </div>

        <div className={`large-title${wide}`}>
          <h1>{booted ? title : "Loading…"}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>

        <main className={`content${wide}`}>
          {error && (
            <div className="banner error" role="alert">
              <Icon name="error" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Deployment errata is organizer business; judges never see it. */}
          {isAdmin && state && state._fallback && (
            <div className="banner warn">
              <Icon name="warning" size={18} />
              <span>
                Running on local file storage — scores will not sync between devices. Add a Redis
                database in your Vercel project settings so every judge shares one scoresheet.
              </span>
            </div>
          )}
          {isAdmin && warnings && (warnings.defaultAdminPassword || warnings.defaultSessionSecret) && (
            <div className="banner warn">
              <Icon name="warning" size={18} />
              <span>
                This deployment is still using built-in development credentials. Set{" "}
                {warnings.defaultAdminPassword && <code>ADMIN_PASSWORD</code>}
                {warnings.defaultAdminPassword && warnings.defaultSessionSecret && " and "}
                {warnings.defaultSessionSecret && <code>SESSION_SECRET</code>} before the real
                event.
              </span>
            </div>
          )}

          {!booted && <div className="empty">Loading scoresheet…</div>}

          {booted && !session && authView === "choose" && <RoleChooser onChoose={setAuthView} />}

          {booted && !session && authView !== "choose" && (
            <LoginForm
              role={authView}
              judges={state ? state.judges : []}
              onSignedIn={handleSignedIn}
            />
          )}

          {booted && state && isJudge && (
            <JudgePanel
              state={state}
              judge={session}
              participantId={participantId}
              onParticipantChange={setParticipantId}
              onSubmitScore={submitScore}
            />
          )}

          {booted && state && isAdmin && (
            <>
              <div className="segmented" role="tablist" aria-label="Organizer sections">
                <button
                  role="tab"
                  aria-selected={tab === "admin"}
                  onClick={() => {
                    setTab("admin");
                    setExpandedResult(null);
                  }}
                >
                  Setup
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "results"}
                  onClick={() => setTab("results")}
                >
                  Results
                </button>
              </div>

              {tab === "admin" && <AdminPanel state={state} onPatch={patchState} />}
              {tab === "results" && (
                <ResultsPanel
                  state={state}
                  expanded={expandedResult}
                  onExpandedChange={setExpandedResult}
                />
              )}
            </>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message={
          isJudge
            ? "You will need your PIN from the organizer to sign back in. Every score you have already sent stays saved."
            : "You will need the organizer password to sign back in. Nothing you have set up is lost."
        }
        confirmLabel="Sign out"
        cancelLabel="Stay"
        onConfirm={signOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </>
  );
}
