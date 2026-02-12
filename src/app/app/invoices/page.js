"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function InvoicesListPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [invoices, setInvoices] = useState([]);

  const load = async () => {
    setErrorMsg("");
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, total, created_at, client")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) return setErrorMsg(error.message);
    setInvoices(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const setStatus = async (id, nextStatus) => {
    setErrorMsg("");

    const { data, error } = await supabase
      .from("invoices")
      .update({ status: nextStatus })
      .eq("id", id)
      .select("id, invoice_number, status, total, created_at, client")
      .single();

    if (error) return setErrorMsg(error.message);

    setInvoices((prev) => prev.map((inv) => (inv.id === id ? data : inv)));
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/app")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => router.push("/app/invoices/new")}
              className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              + New invoice
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-sm text-gray-600">Loading invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-sm text-gray-600">No invoices yet.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  {/* Clickable info */}
                  <button
                    onClick={() => router.push(`/app/invoices/${inv.id}`)}
                    className="text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900">{inv.invoice_number}</div>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {(inv.status || "draft").toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {inv.client?.name || "—"} • {formatDate(inv.created_at)}
                    </div>
                  </button>

                  {/* Right side */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatMoney(inv.total)}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>

                    {/* Status buttons (only here) */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(inv.id, "sent")}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        Sent
                      </button>
                      <button
                        onClick={() => setStatus(inv.id, "paid")}
                        className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                      >
                        Paid
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={load}
          className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
    </main>
  );
}
