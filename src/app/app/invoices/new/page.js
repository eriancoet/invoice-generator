"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

const emptyItem = { description: "", qty: 1, rate: 0 };

export default function NewInvoicePage() {
  const router = useRouter();

  const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");

  // Sender (your company)
  const [senderCompany, setSenderCompany] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderLogoUrl, setSenderLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  // Receiver (client)
  const [receiverCompany, setReceiverCompany] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");

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

  async function uploadSenderLogo(file) {
    setErrorMsg("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file for the logo.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Logo is too large. Max 2MB.");
      return;
    }

    setLogoUploading(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      const user = userRes?.user;

      if (userErr || !user) {
        router.replace("/login");
        return;
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;

      // bucket: logos (public)
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("logos").getPublicUrl(path);
      const publicUrl = pub?.publicUrl;

      if (!publicUrl) throw new Error("Could not get a public URL for the logo.");

      // cache-bust so you always see latest
      setSenderLogoUrl(`${publicUrl}?v=${Date.now()}`);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  }

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
      sender: {
        company: senderCompany,
        email: senderEmail,
        address: senderAddress,
        logo_url: senderLogoUrl,
      },
      receiver: {
        company: receiverCompany,
        name: clientName,
        email: clientEmail,
        address: receiverAddress,
      },
      items,
      subtotal,
      tax,
      total,
    };

    const { data, error } = await supabase.from("invoices").insert(payload).select("id").single();

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
          <a href="/app" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            ← Back to dashboard
          </a>
        </div>

        {/* Single column (no preview) */}
        <div className="mt-6">
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

              {/* Sender */}
              <div className="mt-2 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Your business</p>

                  <label className="cursor-pointer text-xs font-semibold text-gray-900 hover:underline">
                    {logoUploading ? "Uploading..." : senderLogoUrl ? "Change logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={logoUploading}
                      onChange={(e) => uploadSenderLogo(e.target.files?.[0])}
                    />
                  </label>
                </div>

                {senderLogoUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <Image src={senderLogoUrl} alt="Business logo" fill className="object-contain" />
                    </div>
                    <p className="text-xs text-gray-500">This logo will appear on the invoice.</p>
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company name</label>
                    <input
                      value={senderCompany}
                      onChange={(e) => setSenderCompany(e.target.value)}
                      placeholder="Rian Web Design"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Business email</label>
                    <input
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Business address</label>
                  <textarea
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    placeholder="Street, City, Province, Postal Code"
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                  />
                </div>
              </div>

              {/* Receiver */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Client</p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company name</label>
                    <input
                      value={receiverCompany}
                      onChange={(e) => setReceiverCompany(e.target.value)}
                      placeholder="Client company (optional)"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact name</label>
                    <input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="John Smith"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client email</label>
                    <input
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Tax %</label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="15"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Client address</label>
                  <textarea
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    placeholder="Street, City, Province, Postal Code"
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Line items */}
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
                  <div key={idx} className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-12">
                    <div className="sm:col-span-6">
                      <label className="text-xs font-medium text-gray-600">Description</label>
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                        placeholder="Web design services"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-600">Qty</label>
                      <input
                        type="number"
                        value={it.qty}
                        onChange={(e) => updateItem(idx, { qty: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs font-medium text-gray-600">Rate</label>
                      <input
                        type="number"
                        value={it.rate}
                        onChange={(e) => updateItem(idx, { rate: e.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                        placeholder="0"
                      />
                    </div>

                    <div className="sm:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals summary (optional but nice on form) */}
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-700">
                <span>Tax</span>
                <span>{tax.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{total.toFixed(2)}</span>
              </div>
            </div>

            {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}

            <button
              onClick={saveInvoice}
              disabled={loading || logoUploading}
              className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save invoice"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
