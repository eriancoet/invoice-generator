"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setErrorMsg("");

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const user = userRes?.user;

      if (userErr || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, total, created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInvoices(data || []);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const draft = invoices.filter((i) => (i.status || "").toLowerCase() === "draft").length;
    const sent = invoices.filter((i) => (i.status || "").toLowerCase() === "sent").length;
    const paid = invoices.filter((i) => (i.status || "").toLowerCase() === "paid").length;
    return { totalCount, draft, sent, paid };
  }, [invoices]);

  const latest = invoices[0] || null;

  const formatMoney = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-64 rounded-lg bg-gray-200 animate-pulse" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="mt-8 h-60 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Signed in as {userEmail}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/app/invoices/new")}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              + New invoice
            </button>
            <button
              onClick={() => router.push("/app/invoices")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              View invoices
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total invoices" value={stats.totalCount} />
          <StatCard label="Draft" value={stats.draft} />
          <StatCard label="Sent" value={stats.sent} />
          <StatCard label="Paid" value={stats.paid} />
        </div>

        {/* Continue */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-900">Continue</h2>

            {latest ? (
              <div className="mt-4">
                <p className="text-xs text-gray-500">Most recent invoice</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {latest.invoice_number || "Invoice"}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <Badge status={latest.status} />
                  <span className="text-sm font-semibold text-gray-900">
                    {formatMoney(latest.total)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">{formatDate(latest.created_at)}</p>

                <button
                  onClick={() => router.push(`/app/invoices/${latest.id}`)}
                  className="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  Open invoice
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-900">No invoices yet</p>
                <p className="mt-1 text-sm text-gray-600">
                  Create your first invoice to see it here.
                </p>
                <button
                  onClick={() => router.push("/app/invoices/new")}
                  className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  Create your first invoice
                </button>
              </div>
            )}
          </div>

          {/* Recent invoices */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent invoices</h2>
              <button
                onClick={() => router.push("/app/invoices")}
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                View all
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMsg}
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                <div className="col-span-5">Invoice</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-right">Date</div>
              </div>

              <div className="divide-y divide-gray-200">
                {invoices.length ? (
                  invoices.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => router.push(`/app/invoices/${inv.id}`)}
                      className="grid w-full grid-cols-12 items-center px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="col-span-5 font-semibold text-gray-900">
                        {inv.invoice_number || "Invoice"}
                      </div>
                      <div className="col-span-3">
                        <Badge status={inv.status} />
                      </div>
                      <div className="col-span-2 text-right font-semibold text-gray-900">
                        {formatMoney(inv.total)}
                      </div>
                      <div className="col-span-2 text-right text-gray-600">
                        {formatDate(inv.created_at)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-600">
                    No invoices yet. Click “New invoice” to create one.
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <QuickAction
                title="Create a new invoice"
                desc="Start from a clean template."
                onClick={() => router.push("/app/invoices/new")}
              />
              <QuickAction
                title="Manage invoices"
                desc="Search, filter, and update status."
                onClick={() => router.push("/app/invoices")}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

function Badge({ status }) {
  const s = (status || "draft").toLowerCase();
  const map = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-green-50 text-green-700 border-green-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
  };
  const cls = map[s] || map.draft;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

function QuickAction({ title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:bg-gray-50"
    >
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </button>
  );
}
