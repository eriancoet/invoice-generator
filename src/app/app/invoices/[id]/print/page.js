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

      const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();

      if (error) {
        setErrorMsg(error.message);
        setInvoice(null);
        setLoading(false);
        return;
      }

      setInvoice(data || null);
      setLoading(false);

      // Give React a tick to render before printing
      setTimeout(() => window.print(), 300);
    };

    if (id) load();
  }, [id]);

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const rows = useMemo(() => (Array.isArray(invoice?.items) ? invoice.items : []), [invoice]);

  // Support both schemas:
  const receiver = invoice?.receiver || invoice?.client || {};
  const sender = invoice?.sender || {};

  if (loading) return <div className="p-8 text-sm">Preparing PDF…</div>;
  if (!invoice) return <div className="p-8 text-sm text-red-600">{errorMsg || "Invoice not found"}</div>;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <style>{`
        /* Screen layout */
        .print-sheet {
          background: white;
        }

        /* Print layout */
        @media print {
          @page {
            size: A4;
            margin: 16mm;
          }

          html, body {
            background: white !important;
          }

          body {
            margin: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          /* Remove any “card” look in print */
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: auto !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Avoid clipping issues */
          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Buttons only on screen */}
      <div className="no-print mx-auto mb-6 flex w-full max-w-[820px] gap-3">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {/* Invoice sheet */}
      <div className="print-sheet mx-auto w-full max-w-[820px] rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
            <p className="mt-2 text-sm text-gray-600">{invoice.invoice_number || "—"}</p>
            <p className="mt-1 text-sm text-gray-600">Date: {formatDate(invoice.created_at)}</p>
          </div>

          <div className="text-right">
            <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
              {(invoice.status || "draft").toUpperCase()}
            </span>
            <p className="mt-4 text-3xl font-bold">{formatMoney(invoice.total)}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
        </div>

        {/* Parties */}
        <div className="avoid-break mt-10 grid grid-cols-2 gap-10 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500">BILL TO</p>
            <p className="mt-2 font-semibold text-gray-900">
              {receiver.company || receiver.name || "—"}
            </p>
            {receiver.name && receiver.company ? (
              <p className="text-gray-700">{receiver.name}</p>
            ) : null}
            <p className="text-gray-600">{receiver.email || "—"}</p>
            {receiver.address ? (
              <p className="mt-2 whitespace-pre-line text-gray-600">{receiver.address}</p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500">FROM</p>
            <p className="mt-2 font-semibold text-gray-900">{sender.company || "—"}</p>
            <p className="text-gray-600">{sender.email || "—"}</p>
            {sender.address ? (
              <p className="mt-2 whitespace-pre-line text-gray-600">{sender.address}</p>
            ) : null}
          </div>
        </div>

        {/* Items */}
        <div className="avoid-break mt-10 overflow-hidden rounded-xl border border-gray-200">
          <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          <div className="divide-y divide-gray-200">
            {rows.length ? (
              rows.map((it, idx) => {
                const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
                return (
                  <div key={idx} className="grid grid-cols-12 px-4 py-3 text-sm">
                    <div className="col-span-6 text-gray-900">{it.description || "—"}</div>
                    <div className="col-span-2 text-right text-gray-700">{it.qty || 0}</div>
                    <div className="col-span-2 text-right text-gray-700">{formatMoney(it.rate)}</div>
                    <div className="col-span-2 text-right font-semibold text-gray-900">
                      {formatMoney(amount)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-sm text-gray-600">No line items.</div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="avoid-break mt-8 ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{formatMoney(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax</span>
            <span>{formatMoney(invoice.tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{formatMoney(invoice.total)}</span>
          </div>
        </div>

        <p className="mt-12 text-xs text-gray-500">Generated by Invoice Generator</p>
      </div>
    </main>
  );
}
