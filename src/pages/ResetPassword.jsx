import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageIntro from "../components/PageIntro";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { getAuthRedirectUrl } from "../lib/url";
import "./Account.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [recoveryMode, setRecoveryMode] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setRecoveryMode(true);
      }
    };

    void checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setMessage("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const sendResetEmail = async (event) => {
    event.preventDefault();

    setBusy(true);
    setMessage("");

    try {
      if (!isSupabaseConfigured) {
        setMessage(
          "Account services are not configured yet."
        );
        return;
      }

      const redirectTo = getAuthRedirectUrl("/reset-password");

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo,
          }
        );

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder."
      );
    } catch {
      setMessage(
        "We could not send the reset email. Please try again later."
      );
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "Your password has been changed successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/account");
      }, 1500);
    } catch {
      setMessage(
        "We could not update your password. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell account-page">
      <Link className="back-link" to="/account">
        ← Back to account
      </Link>

      <PageIntro
        eyebrow="Account security"
        title={
          recoveryMode
            ? "Choose a new password."
            : "Reset your password."
        }
        description={
          recoveryMode
            ? "Choose a strong password you can save securely with your device or password manager."
            : "Enter your account email and we'll send you a secure password-reset link."
        }
      />

      <form
        className="account-form"
        onSubmit={
          recoveryMode
            ? updatePassword
            : sendResetEmail
        }
      >
        {!recoveryMode ? (
          <>
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

            <button
              className="button"
              disabled={busy}
              type="submit"
            >
              {busy
                ? "Sending..."
                : "Send reset link"}
            </button>
          </>
        ) : (
          <>
            <label>
              New password

              <div className="password-field">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label>
              Confirm new password

              <div className="password-field">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  required
                  minLength={8}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </label>

            <button
              className="button"
              disabled={busy}
              type="submit"
            >
              {busy
                ? "Updating..."
                : "Update password"}
            </button>

            <p className="password-manager-note">
              🔐 Your device may offer to save the new
              password to Google Password Manager, Samsung
              Pass, iCloud Keychain, or another password
              manager.
            </p>
          </>
        )}

        {message ? (
          <p className="account-message" role="status">
            {message}
          </p>
        ) : null}

        {!recoveryMode ? (
          <Link
            className="account-switch"
            to="/account"
          >
            Back to sign in
          </Link>
        ) : null}
      </form>
    </div>
  );
}