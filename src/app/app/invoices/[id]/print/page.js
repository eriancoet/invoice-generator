"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PrintInvoicePage() {
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setErrorMsg("");

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        setErrorMsg("Please sign in.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (error) setErrorMsg(error.message);
      setInvoice(data || null);
      setLoading(false);

      // give the page a tick to render, then open print dialog
      setTimeout(() => window.print(), 400);
    };

    if (id) load();
  }, [id]);

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const rows = useMemo(() => (Array.isArray(invoice?.items) ? invoice.items : []), [invoice]);

  if (loading) return <div className="p-8 text-sm">Preparing PDF…</div>;

  if (!invoice) return <div className="p-8 text-sm text-red-600">{errorMsg || "Invoice not found"}</div>;

  return (
    <div className="min-h-screen bg-white p-10 text-gray-900">
      {/* Print styling */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900"
        >
          Close
        </button>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoice</h1>
            <p className="mt-1 text-sm text-gray-600">{invoice.invoice_number}</p>
            <p className="mt-2 text-sm text-gray-600">Date: {formatDate(invoice.created_at)}</p>
          </div>

          <div className="text-right">
            <div className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold">
              {(invoice.status || "draft").toUpperCase()}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500">BILL TO</p>
            <p className="mt-2 font-semibold">{invoice.client?.name || "—"}</p>
            <p className="text-gray-600">{invoice.client?.email || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500">TOTAL</p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(invoice.total)}</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
          <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          <div className="divide-y divide-gray-200">
            {rows.map((it, idx) => {
              const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
              return (
                <div key={idx} className="grid grid-cols-12 px-4 py-3 text-sm">
                  <div className="col-span-6">{it.description || "—"}</div>
                  <div className="col-span-2 text-right">{it.qty || 0}</div>
                  <div className="col-span-2 text-right">{formatMoney(it.rate)}</div>
                  <div className="col-span-2 text-right font-semibold">{formatMoney(amount)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax</span>
            <span>{formatMoney(invoice.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatMoney(invoice.total)}</span>
          </div>
        </div>

        <p className="mt-10 text-xs text-gray-500">
          Generated by Invoice Generator
        </p>
      </div>
    </div>
  );
}
