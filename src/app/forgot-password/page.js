"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const sendReset = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setNotice("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
});


    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setNotice("Reset email sent. Please check your inbox (and spam).");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form onSubmit={sendReset} className="space-y-5">
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

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMsg}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {notice}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <a
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-gray-900 hover:underline"
          >
            ← Back to sign in
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          If you don’t see the email, check your spam folder.
        </p>
      </div>
    </main>
  );
}
