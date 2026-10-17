import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { ROLE_LABELS, useAuth } from "../lib/auth";
import { getAuthRedirectUrl } from "../lib/url";
import "./Account.css";

export default function Account() {
  const auth = useAuth();

  const [mode, setMode] = useState("sign-in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [seatOpen, setSeatOpen] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyCount, setPasskeyCount] = useState(0);

  const checkSeat = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase.rpc("admin_seat_is_open");

    if (!error) {
      setSeatOpen(Boolean(data));
    }
  }, []);

  // How many passkeys this account already holds. Drives whether the
  // "Add a passkey" button is offered at all — once one is registered the
  // button disappears.
  const refreshPasskeys = useCallback(async () => {
    if (!isSupabaseConfigured || !auth.isAuthenticated) {
      setPasskeyCount(0);
      return;
    }

    try {
      if (supabase.auth?.passkey?.list && typeof supabase.auth.passkey.list === "function") {
        const { data, error } = await supabase.auth.passkey.list();
        if (!error && Array.isArray(data)) {
          setPasskeyCount(data.length);
        }
      } else if (typeof supabase.auth?._listPasskeys === "function") {
        const { data, error } = await supabase.auth._listPasskeys();
        if (!error && Array.isArray(data)) {
          setPasskeyCount(data.length);
        }
      }
    } catch {
      // Older clients or unconfigured passkeys simply keep the count at zero.
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    void checkSeat();

    setPasskeySupported(
      typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined"
    );
  }, [checkSeat, auth.profile]);

  useEffect(() => {
    void refreshPasskeys();
  }, [refreshPasskeys]);

  const submit = async (event) => {
    event.preventDefault();

    setBusy(true);
    setMessage("");
    setShowResendConfirmation(false);

    try {
      if (!isSupabaseConfigured) {
        setMessage(
          "Account services are not configured yet. Please contact the church administrator."
        );
        return;
      }

      if (mode === "sign-in") {
        const result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (result.error) {
          setMessage(result.error.message);
          const lower = result.error.message.toLowerCase();
          if (lower.includes("email not confirmed")) {
            setMessage(
              "Your email address has not been confirmed yet. Please check your inbox and spam folder, or click below to resend the confirmation link."
            );
            setShowResendConfirmation(true);
          } else if (lower.includes("invalid login credentials")) {
            setMessage(
              "Invalid email or password. If you have not registered yet, click 'Need an account? Register'. If you forgot your password, use the reset option below."
            );
          } else if (lower.includes("database error")) {
            setMessage(
              "We encountered an unexpected account verification issue. Please try signing in again or reset your password using the link below."
            );
          } else {
            setMessage(result.error.message);
          }
          return;
        }

        setMessage("Signed in successfully.");
        try {
          await supabase.rpc("ensure_profile");
        } catch {
          // ignore if RPC not available
        }
        await auth.refresh();
        return;
      }

      const result = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: getAuthRedirectUrl("/account"),
        },
      });

      if (result.error) {
        const lower = result.error.message.toLowerCase();
        if (lower.includes("email not confirmed")) {
          setShowResendConfirmation(true);
        }
        setMessage(result.error.message);
        return;
      }

      // Supabase returns an empty identities array when user enumeration protection is on and account already exists
      if (
        result.data?.user &&
        (!result.data.user.identities ||
          result.data.user.identities.length === 0)
      ) {
        setMessage(
          "An account with this email address already exists. Please sign in with your password, or use 'Forgot your password?' if you need to reset it."
        );
        return;
      }

      // If a session exists, the account was automatically confirmed and signed in
      if (result.data?.session) {
        setMessage("Account created and signed in successfully.");
        try {
          await supabase.rpc("ensure_profile");
        } catch {
          // ignore
        }
        await auth.refresh();
        return;
      }

      // If email confirmation is enabled in Supabase project
      setMessage(
        "Account created! Please check your email inbox (and spam folder) to confirm your email before signing in."
      );

      setShowResendConfirmation(true);
      await auth.refresh();
    } catch (error) {
      setMessage(
        error?.message ||
          "We could not reach account services. Please check your internet connection and try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const resendConfirmationEmail = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setMessage("Please enter your email address above first.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl("/account"),
        },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          `A fresh confirmation link has been sent to ${targetEmail}. Please check your inbox and spam folder.`
        );
      }
    } catch (err) {
      setMessage(
        err?.message || "Could not resend confirmation email. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const formatPasskeyError = (error) => {
    const msg = error?.message || "";
    const name = error?.name || "";

    if (
      name === "NotAllowedError" ||
      msg.toLowerCase().includes("timed out") ||
      msg.toLowerCase().includes("not allowed")
    ) {
      return "Passkey prompt was cancelled or timed out.";
    }

    if (name === "InvalidStateError") {
      return "This passkey has already been registered on your account.";
    }

    if (
      msg.toLowerCase().includes("relying party") ||
      msg.toLowerCase().includes("origin") ||
      msg.toLowerCase().includes("securityerror") ||
      name === "SecurityError"
    ) {
      const currentHost =
        typeof window !== "undefined"
          ? window.location.hostname
          : "this domain";
      return `Passkey domain mismatch: The authentication server's WebAuthn Relying Party ID is set to localhost. To enable passkeys on ${currentHost}, update the Site URL in Supabase Dashboard (Authentication > URL Configuration) to https://${currentHost}.`;
    }

    if (
      msg.toLowerCase().includes("no passkey") ||
      msg.toLowerCase().includes("ceremony failed") ||
      msg.toLowerCase().includes("credential not found") ||
      msg.toLowerCase().includes("user not found")
    ) {
      return "No matching passkey found on this device. If you haven't added a passkey yet, sign in with your password first, then click 'Add a passkey' in your profile.";
    }

    return (
      msg || "Passkey operation was cancelled or could not be completed."
    );
  };

  const signInWithPasskey = async () => {
    if (!isSupabaseConfigured) {
      setMessage("Account services are not configured yet.");
      return;
    }

    if (!passkeySupported) {
      setMessage(
        "Passkeys are not supported by this browser or device."
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      if (typeof supabase.auth?.signInWithPasskey !== "function") {
        setMessage("Passkey authentication is not available on this client.");
        return;
      }

      const { error } = await supabase.auth.signInWithPasskey();

      if (error) {
        setMessage(formatPasskeyError(error));
        return;
      }

      setMessage("Signed in with your passkey.");
      await auth.refresh();
    } catch (error) {
      setMessage(formatPasskeyError(error));
    } finally {
      setBusy(false);
    }
  };

  const registerPasskey = async () => {
    if (!isSupabaseConfigured) {
      setMessage("Account services are not configured yet.");
      return;
    }

    if (!passkeySupported) {
      setMessage(
        "Passkeys are not supported by this browser or device."
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      if (typeof supabase.auth?.registerPasskey !== "function") {
        setMessage("Passkey registration is not available on this client.");
        return;
      }

      const { error } = await supabase.auth.registerPasskey();

      if (error) {
        setMessage(formatPasskeyError(error));
        return;
      }

      setMessage(
        "Passkey registered. You can now use it to sign in."
      );

      // The button hides itself as soon as the count comes back non-zero.
      await refreshPasskeys();
    } catch (error) {
      setMessage(formatPasskeyError(error));
    } finally {
      setBusy(false);
    }
  };

  const claimSeat = async () => {
    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.rpc("claim_admin_seat");

      if (error) {
        setMessage(
          `Could not claim the administrator seat: ${error.message}`
        );
        return;
      }

      setMessage("You are now the church administrator.");

      await auth.refresh();
      await checkSeat();
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);

    try {
      await auth.signOut();
      setMessage("Signed out.");
      await checkSeat();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell account-page">
      <Link className="back-link" to="/">
        ← Back to home
      </Link>

      <PageIntro
        eyebrow="Church team access"
        title={
          auth.isAuthenticated
            ? "Your staff account."
            : mode === "sign-in"
              ? "Welcome back."
              : "Create your account."
        }
        description="Use an individual account. Department roles are assigned securely by church administrators."
      />

      {auth.isAuthenticated ? (
        <section className="panel">
          <h2 className="panel-title">
            {auth.profile?.display_name || auth.user?.email}
          </h2>

          <p className="panel-sub">
            {auth.isSuspended
              ? "Your account is suspended. An administrator must reinstate it before you regain staff access."
              : `You are signed in as ${
                  ROLE_LABELS[auth.profile?.role] || "Member"
                }.`}
          </p>

          <div className="row">
            {auth.isAdmin ? (
              <Link className="button" to="/admin">
                Open administration
              </Link>
            ) : null}

            {auth.isStaff ? (
              <Link className="button forest" to="/workspace">
                Open workspace
              </Link>
            ) : null}

            {passkeySupported && passkeyCount === 0 ? (
              <button
                className="button ghost"
                onClick={registerPasskey}
                disabled={busy}
                type="button"
              >
                {busy ? "Please wait…" : "Add a passkey"}
              </button>
            ) : null}

            {passkeySupported && passkeyCount > 0 ? (
              <span className="badge subtle" role="status">
                Passkey active
              </span>
            ) : null}

            <button
              className="button ghost"
              onClick={signOut}
              disabled={busy}
              type="button"
            >
              Sign out
            </button>
          </div>

          {seatOpen ? (
            <div className="panel-sub" style={{ marginTop: 18 }}>
              <span className="badge">Setup</span>

              <p>
                No administrator exists yet. If this is the church's first
                account, claim the administrator seat to begin assigning
                roles.
              </p>

              <button
                className="button"
                onClick={claimSeat}
                disabled={busy}
                type="button"
              >
                {busy
                  ? "Please wait…"
                  : "Claim administrator seat"}
              </button>
            </div>
          ) : null}

          {message ? (
            <p className="account-message" role="status">
              {message}
            </p>
          ) : null}
        </section>
      ) : (
        <form className="account-form" onSubmit={submit}>
          {mode === "sign-up" ? (
            <label>
              Full name

              <input
                value={displayName}
                onChange={(event) =>
                  setDisplayName(event.target.value)
                }
                required
                autoComplete="name"
              />
            </label>
          ) : null}

          <label>
            Email address

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck="false"
            />
          </label>

          <label>
            Password

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                minLength={8}
                autoComplete={
                  mode === "sign-in"
                    ? "current-password"
                    : "new-password"
                }
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {mode === "sign-up" ? (
              <small className="password-help">
                Use at least 8 characters. Your browser or password
                manager may offer to save it securely.
              </small>
            ) : null}
          </label>

          <button className="button" disabled={busy} type="submit">
            {busy
              ? "Please wait..."
              : mode === "sign-in"
                ? "Sign in"
                : "Register"}
          </button>

          {mode === "sign-in" && passkeySupported ? (
            <>
              <div className="account-divider">
                <span>or</span>
              </div>

              <button
                className="button ghost"
                type="button"
                onClick={signInWithPasskey}
                disabled={busy}
              >
                {busy
                  ? "Please wait..."
                  : "Sign in with a passkey"}
              </button>
            </>
          ) : null}

          {mode === "sign-in" ? (
            <Link
              className="account-switch"
              to="/reset-password"
            >
              Forgot your password?
            </Link>
          ) : null}

          <button
            className="account-switch"
            type="button"
            onClick={() => {
              setMode(
                mode === "sign-in" ? "sign-up" : "sign-in"
              );
              setMessage("");
              setShowResendConfirmation(false);
              setPassword("");
            }}
          >
            {mode === "sign-in"
              ? "Need an account? Register"
              : "Already have an account? Sign in"}
          </button>

          {seatOpen ? (
            <p className="account-message" role="status">
              No administrator exists yet — register, then claim
              the administrator seat to set up the church.
            </p>
          ) : null}

          {message ? (
            <p className="account-message" role="status">
              {message}
            </p>
          ) : null}

          {showResendConfirmation ? (
            <button
              className="button ghost"
              type="button"
              onClick={resendConfirmationEmail}
              disabled={busy}
            >
              {busy ? "Sending link…" : "Resend confirmation email"}
            </button>
          ) : null}

          <p className="password-manager-note">
            🔐 Your browser or device may offer to save your
            credentials to Google Password Manager, Samsung Pass,
            iCloud Keychain, or another password manager.
          </p>
        </form>
      )}
    </div>
  );
}