"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setErrorMsg("");

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const user = userRes?.user;

      if (userErr || !user) {
        router.replace("/login");
        return;
      }

        setUserName(
        user.user_metadata?.full_name || user.email || ""
        );

      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, status, total, created_at, receiver, client, sender")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) setErrorMsg(error.message);
      else setInvoices(data || []);

      setLoading(false);
    };

    load();
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (invoices || []).filter((inv) => {
      const status = (inv.status || "draft").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!q) return true;

      const num = (inv.invoice_number || "").toLowerCase();

      // Support both old schema (client) and new schema (receiver)
      const receiverName =
        (inv.receiver?.name || inv.client?.name || "").toLowerCase();
      const receiverCompany =
        (inv.receiver?.company || "").toLowerCase();
      const receiverEmail =
        (inv.receiver?.email || inv.client?.email || "").toLowerCase();

      return (
        num.includes(q) ||
        receiverName.includes(q) ||
        receiverCompany.includes(q) ||
        receiverEmail.includes(q)
      );
    });
  }, [invoices, query, statusFilter]);

  const latest = filtered[0] || null;

  const formatMoney = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const displayClient = (inv) => {
    const r = inv.receiver || inv.client || {};
    const nameLine =
      r.company?.trim()
        ? r.company
        : r.name?.trim()
        ? r.name
        : "—";
    const subLine = r.email?.trim() ? r.email : "";
    return { nameLine, subLine };
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="h-8 w-72 rounded-xl bg-gray-200 animate-pulse" />
          <div className="mt-4 h-16 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="mt-6 h-80 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Pro header card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h1>
             <p className="mt-1 text-sm text-gray-600">
            Welcome back{userName ? `, ${userName}` : ""}.
            </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
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
                View all invoices
              </button>
            </div>
          </div>

          {/* Search + filters */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-600">
                Search invoices
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by invoice number, client name, company, or email…"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Continue card */}
          {latest && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600">
                    Continue where you left off
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {latest.invoice_number || "Invoice"} •{" "}
                    {formatMoney(latest.total)} •{" "}
                    {formatDate(latest.created_at)}
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/app/invoices/${latest.id}`)}
                  className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  Open invoice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
              <p className="mt-1 text-xs text-gray-600">
                Showing {filtered.length} invoice{filtered.length === 1 ? "" : "s"}.
              </p>
            </div>

            <button
              onClick={() => router.push("/app/invoices")}
              className="text-sm font-semibold text-gray-900 hover:underline"
            >
              Manage
            </button>
          </div>

          {errorMsg && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
              <div className="col-span-4">Invoice</div>
              <div className="col-span-4">Client</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-2 text-right">Date</div>
            </div>

            <div className="divide-y divide-gray-200">
              {filtered.length ? (
                filtered.map((inv) => {
                  const c = displayClient(inv);
                  return (
                    <button
                      key={inv.id}
                      onClick={() => router.push(`/app/invoices/${inv.id}`)}
                      className="grid w-full grid-cols-12 items-center px-4 py-4 text-left hover:bg-gray-50"
                    >
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {inv.invoice_number || "Invoice"}
                            </p>
                            <div className="mt-1">
                              <Badge status={inv.status} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-4 min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {c.nameLine}
                        </p>
                        {c.subLine ? (
                          <p className="truncate text-xs text-gray-600">{c.subLine}</p>
                        ) : (
                          <p className="text-xs text-gray-500">—</p>
                        )}
                      </div>

                      <div className="col-span-2 text-right text-sm font-semibold text-gray-900">
                        {formatMoney(inv.total)}
                      </div>

                      <div className="col-span-2 text-right text-sm text-gray-600">
                        {formatDate(inv.created_at)}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-gray-900">No invoices found</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Try a different search or create a new invoice.
                  </p>
                  <button
                    onClick={() => router.push("/app/invoices/new")}
                    className="mt-4 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                  >
                    + New invoice
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom hint */}
          <p className="mt-4 text-xs text-gray-500">
            Tip: Click any invoice to view, edit, share, or download a PDF.
          </p>
        </div>
      </div>
    </main>
  );
}

function Badge({ status }) {
  const s = (status || "draft").toLowerCase();
  const map = {
    draft: "bg-gray-100 text-gray-800 border-gray-200",
    sent: "bg-blue-50 text-blue-800 border-blue-200",
    paid: "bg-green-50 text-green-800 border-green-200",
    overdue: "bg-red-50 text-red-800 border-red-200",
  };
  const cls = map[s] || map.draft;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}
