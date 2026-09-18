import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import AdminPanel from "../components/AdminPanel";
import JudgePanel from "../components/JudgePanel";
import ResultsPanel from "../components/ResultsPanel";
import RoleChooser from "../components/RoleChooser";
import LoginForm from "../components/LoginForm";
import BackBar from "../components/BackBar";
import ConfirmDialog from "../components/ConfirmDialog";

const ADMIN_TABS = [
  { id: "admin", label: "Setup" },
  { id: "results", label: "Results" },
];

export default function Home() {
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [authView, setAuthView] = useState("choose"); // choose | judge | admin
  const [tab, setTab] = useState("admin");
  const [participantId, setParticipantId] = useState("");
  const [expandedResult, setExpandedResult] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      setState(await res.json());
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

  // Only poll once somebody is signed in — there is nothing live to watch on
  // the sign-in screen, and it keeps idle phones off the network.
  useEffect(() => {
    if (!session) return undefined;
    const interval = setInterval(loadState, 6000);
    return () => clearInterval(interval);
  }, [session, loadState]);

  async function handleSignedIn(newSession) {
    setSession(newSession);
    setParticipantId("");
    setExpandedResult(null);
    setTab("admin");
    await Promise.all([loadSession(), loadState()]);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setWarnings(null);
    setAuthView("choose");
    setParticipantId("");
    setExpandedResult(null);
    setConfirmSignOut(false);
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

  /**
   * Back always steps up exactly one level rather than jumping to the start,
   * so nobody loses their place by accident. Only the top level of a role
   * leaves it, and that path is confirmed first.
   */
  function resolveBack() {
    if (!session) {
      if (authView === "choose") return null;
      return { label: "Choose a different role", run: () => setAuthView("choose") };
    }

    if (isJudge) {
      if (participantId) {
        return { label: "Back to all participants", run: () => setParticipantId("") };
      }
      return { label: "Choose a different role", run: () => setConfirmSignOut(true) };
    }

    if (tab === "results") {
      if (expandedResult) {
        return { label: "Back to the results table", run: () => setExpandedResult(null) };
      }
      return { label: "Back to setup", run: () => setTab("admin") };
    }
    return { label: "Choose a different role", run: () => setConfirmSignOut(true) };
  }

  const back = resolveBack();
  const canGoBack = Boolean(back);

  // The device back button and back gesture run the same step-up logic as the
  // back bar. A guard entry is kept on the history stack so a press can be
  // intercepted; without it, back would leave the app entirely.
  const backRef = useRef(null);
  backRef.current = back;

  useEffect(() => {
    function onPopState() {
      if (backRef.current) backRef.current.run();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Re-armed after every render, so there is always exactly one guard entry
  // whenever there is somewhere to go back to.
  useEffect(() => {
    if (!canGoBack) return;
    const armed = Boolean(window.history.state && window.history.state.judgingGuard);
    if (!armed) window.history.pushState({ judgingGuard: true }, "");
  });

  function goBack() {
    if (!back) return;
    const armed = Boolean(window.history.state && window.history.state.judgingGuard);
    // Popping the guard keeps the browser's history in step with the app, and
    // the popstate handler above performs the actual navigation.
    if (armed) window.history.back();
    else back.run();
  }

  return (
    <>
      <Head>
        <title>{eventName}</title>
      </Head>
      <div className="shell">
        <header className="masthead">
          <div>
            <h1>{booted ? eventName : "Loading…"}</h1>
            <div className="tag">Live scoring &amp; automatic tally</div>
          </div>
          {session && (
            <div className="masthead-meta">
              <div className="who">
                <span className="dot" />
                {isJudge ? `Judging as ${session.judgeName}` : "Organizer"}
              </div>
              <button className="btn-icon" onClick={() => setConfirmSignOut(true)}>
                Sign out
              </button>
            </div>
          )}
        </header>

        <BackBar label={back ? back.label : null} onBack={goBack} />

        {error && <div className="banner warn">{error}</div>}

        {/* Storage and configuration warnings are organizer business — judges
            shouldn't be shown deployment errata mid-event. */}
        {isAdmin && state && state._fallback && (
          <div className="banner warn">
            Running on local file storage — scores won&apos;t sync between different devices.
            Add a Redis database in your Vercel project settings so every judge shares one live
            scoresheet. See the README for setup steps.
          </div>
        )}
        {isAdmin && warnings && (warnings.defaultAdminPassword || warnings.defaultSessionSecret) && (
          <div className="banner warn">
            This deployment is still using the built-in development credentials. Set{" "}
            {warnings.defaultAdminPassword && <code>ADMIN_PASSWORD</code>}
            {warnings.defaultAdminPassword && warnings.defaultSessionSecret && " and "}
            {warnings.defaultSessionSecret && <code>SESSION_SECRET</code>} as environment variables
            before the real event.
          </div>
        )}

        {!booted && <div className="empty">Loading scoresheet…</div>}

        {booted && !session && authView === "choose" && (
          <RoleChooser eventName={eventName} onChoose={setAuthView} />
        )}

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
            <nav className="tabs">
              {ADMIN_TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => {
                    setTab(t.id);
                    setExpandedResult(null);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </nav>
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

        <div className="footer-note">
          {session ? "scores refresh automatically every 6s" : "sign in to continue"}
        </div>
      </div>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        message={
          isJudge
            ? "You'll need your PIN from the organizer to sign back in. Every score you've already submitted stays saved."
            : "You'll need the organizer password to sign back in. Nothing you've set up is lost."
        }
        confirmLabel="Sign out"
        cancelLabel="Stay here"
        onConfirm={signOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </>
  );
}
