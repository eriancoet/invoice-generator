"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const emptyItem = { description: "", qty: 1, rate: 0 };

export default function NewInvoicePage() {
  const router = useRouter();

  const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [items, setItems] = useState([emptyItem]);
  const [taxRate, setTaxRate] = useState(0); // percent
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  }, [items]);

  const tax = useMemo(() => subtotal * ((Number(taxRate) || 0) / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const saveInvoice = async () => {
    setErrorMsg("");
    setLoading(true);

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const user = userRes?.user;

    if (userErr || !user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const payload = {
      user_id: user.id,
      invoice_number: invoiceNumber,
      status: "draft",
      client: { name: clientName, email: clientEmail },
      items,
      subtotal,
      tax,
      total,
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert(payload)
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push(`/app/invoices/${data.id}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <a
            href="/app"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            ← Back to dashboard
          </a>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Invoice #</label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                 className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100" 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Client name</label>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100" 
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Client email</label>
                  <input
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Tax %</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100" 
                  placeholder="15"
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Line items</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  + Add item
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-12"
                  >
                    <div className="sm:col-span-6">
                      <label className="text-xs font-medium text-gray-600">Description</label>
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"                        placeholder="Web design services"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-600">Qty</label>
                      <input
                        type="number"
                        value={it.qty}
                        onChange={(e) => updateItem(idx, { qty: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs font-medium text-gray-600">Rate</label>
                      <input
                        type="number"
                        value={it.rate}
                        onChange={(e) => updateItem(idx, { rate: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"                        placeholder="0"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"                        disabled={items.length === 1}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              onClick={saveInvoice}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save invoice"}
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Preview</h2>

            <div className="mt-4 rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">Invoice</p>
                  <p className="text-lg font-semibold text-gray-900">{invoiceNumber}</p>
                  <p className="mt-3 text-sm text-gray-700">
                    <span className="font-medium">Client:</span>{" "}
                    {clientName || "—"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Email:</span>{" "}
                    {clientEmail || "—"}
                  </p>
                </div>

                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  Draft
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
                <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {items.map((it, idx) => {
                    const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
                    return (
                      <div key={idx} className="grid grid-cols-12 px-4 py-3 text-sm">
                        <div className="col-span-6 text-gray-900">
                          {it.description || "—"}
                        </div>
                        <div className="col-span-2 text-right text-gray-700">{it.qty || 0}</div>
                        <div className="col-span-2 text-right text-gray-700">{Number(it.rate || 0).toFixed(2)}</div>
                        <div className="col-span-2 text-right font-medium text-gray-900">{amount.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax</span>
                  <span>{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              PDF export comes next (we’ll use a print-friendly invoice view).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
