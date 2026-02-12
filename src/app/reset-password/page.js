"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };
    check();
  }, []);

  const updatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setNotice("");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) return setErrorMsg(error.message);

    setNotice("Password updated. Redirecting…");
    setTimeout(() => router.push("/app"), 800);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Choose a strong password to secure your account.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {!ready ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              This reset link is missing or expired. Please request a new one.
              <div className="mt-3">
                <a href="/forgot-password" className="font-semibold hover:underline">
                  Request a new reset link →
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={updatePassword} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                />
                <p className="mt-2 text-xs text-gray-500">Use at least 8 characters.</p>
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
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          <a
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-gray-900 hover:underline"
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </main>
  );
}
