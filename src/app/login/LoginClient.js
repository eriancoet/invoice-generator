"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserEmail(data.user.email || "");
    };
    check();

    // ✅ read mode from URL: /login?mode=signup
    const urlMode = searchParams.get("mode");
    if (urlMode === "signup") setMode("signup");
    if (urlMode === "signin") setMode("signin");

    const err = searchParams.get("error");
    if (err === "confirm_failed") {
      setErrorMsg("Email confirmation failed. Please try signing in again.");
    }

    const confirmed = searchParams.get("confirmed");
    if (confirmed === "1") {
      setNotice("Email confirmed! You can sign in now.");
      setMode("signin");
      // keep URL clean + consistent
      router.replace("/login?mode=signin");
    }
  }, [searchParams, router]);

  const clearMsgs = () => {
    setErrorMsg("");
    setNotice("");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserEmail("");
  };

  const signIn = async (e) => {
    e.preventDefault();
    clearMsgs();
    setShowForgot(false);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setLoading(false);

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const message = msg.includes("invalid") ? "Invalid email or password." : error.message;

      setErrorMsg(message);
      setShowForgot(true);
      return;
    }

    router.push("/app");
  };

  const signUp = async (e) => {
    e.preventDefault();
    clearMsgs();
    setShowForgot(false);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

        const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
            data: {
            full_name: fullName.trim(),
            },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        },
        });


    setLoading(false);

    if (error) {
      const msg = (error.message || "").toLowerCase();

      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists") || msg.includes("duplicate")) {
        setMode("signin");
        router.replace("/login?mode=signin");
        setErrorMsg("That email is already in use. Please sign in instead.");
        setShowForgot(true);
        setNotice("If you never confirmed your email, click “Resend confirmation email”.");
        return;
      }

      setErrorMsg(error.message);
      return;
    }

    setNotice(
      "If this email is new, we sent you a confirmation email. If you already have an account, please sign in instead. If you never confirmed your email, click “Resend confirmation email”."
    );
  };

  const resendConfirmation = async () => {
    clearMsgs();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg("Enter your email first, then resend.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) return setErrorMsg(error.message);

    setNotice("Confirmation email resent. Please check your inbox/spam.");
  };

  if (userEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">You’re already signed in</h1>
          <p className="mt-2 text-sm text-gray-600">Signed in as: {userEmail}</p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push("/app")}
              className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Go to dashboard
            </button>
            <button
              onClick={signOut}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Invoice Generator</h1>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "signin" ? "Sign in to manage your invoices." : "Create your account to get started."}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={mode === "signin" ? signIn : signUp} className="space-y-5">
            {mode === "signup" && (
            <div>
                <label className="text-sm font-medium text-gray-700">
                Full name
                </label>
                <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rian Coetzee"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                />
            </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMsg}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                <div>{notice}</div>

                <button
                  type="button"
                  onClick={resendConfirmation}
                  disabled={loading || !email}
                  className="mt-3 inline-flex items-center justify-center rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-900 shadow-sm hover:bg-green-50 disabled:opacity-60"
                >
                  Resend confirmation email
                </button>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            {showForgot && (
              <div className="text-center">
                <a href="/forgot-password" className="text-sm font-semibold text-gray-900 hover:underline">
                  Forgot your password?
                </a>
              </div>
            )}
          </form>

          {/* Toggle link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            {mode === "signin" ? (
              <>
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    clearMsgs();
                    setShowForgot(false);
                    router.replace("/login?mode=signup"); // ✅ keep URL in sync
                  }}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    clearMsgs();
                    setShowForgot(false);
                    router.replace("/login?mode=signin"); // ✅ keep URL in sync
                  }}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">By continuing, you agree to our Terms and Privacy Policy.</p>
      </div>
    </main>
  );
}
