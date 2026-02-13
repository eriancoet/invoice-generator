"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Download } from "lucide-react";

const emptyItem = { description: "", qty: 1, rate: 0 };

export default function InvoiceViewPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [invoice, setInvoice] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Editable fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [status, setStatus] = useState("draft");

  // Sender (your business)
  const [senderCompany, setSenderCompany] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderLogoUrl, setSenderLogoUrl] = useState("");

  // Receiver (client)
  const [receiverCompany, setReceiverCompany] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");

  // Items + tax
  const [items, setItems] = useState([emptyItem]);
  const [taxRate, setTaxRate] = useState(0);

  // Share dropdown
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setErrorMsg("");

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setInvoice(data);

      // Hydrate edit state
      setInvoiceNumber(data.invoice_number || "");
      setStatus((data.status || "draft").toLowerCase());

      // NEW: sender/receiver (preferred)
      setSenderCompany(data.sender?.company || "");
      setSenderEmail(data.sender?.email || "");
      setSenderAddress(data.sender?.address || "");
      setSenderLogoUrl(data.sender?.logo_url || "");

      setReceiverCompany(data.receiver?.company || "");
      setReceiverName(data.receiver?.name || "");
      setReceiverEmail(data.receiver?.email || "");
      setReceiverAddress(data.receiver?.address || "");

      // Backward compatibility: if older invoices used client:{name,email}
      if (!data.receiver && data.client) {
        setReceiverName(data.client?.name || "");
        setReceiverEmail(data.client?.email || "");
      }

      setItems(Array.isArray(data.items) && data.items.length ? data.items : [emptyItem]);

      const sub = Number(data.subtotal || 0);
      const t = Number(data.tax || 0);
      const inferredTaxRate = sub > 0 ? (t / sub) * 100 : 0;
      setTaxRate(Number.isFinite(inferredTaxRate) ? Number(inferredTaxRate.toFixed(2)) : 0);

      setLoading(false);
    };

    if (id) load();
  }, [id, router]);

  // Close share menu on outside click + ESC
  useEffect(() => {
    if (!shareOpen) return;

    const onDown = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setShareOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [shareOpen]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
    [items]
  );
  const tax = useMemo(() => subtotal * ((Number(taxRate) || 0) / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const formatMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const saveChanges = async () => {
    setErrorMsg("");
    setSaving(true);

    const payload = {
      invoice_number: invoiceNumber,
      status,
      sender: {
        company: senderCompany,
        email: senderEmail,
        address: senderAddress,
        logo_url: senderLogoUrl,
      },
      receiver: {
        company: receiverCompany,
        name: receiverName,
        email: receiverEmail,
        address: receiverAddress,
      },
      items,
      subtotal,
      tax,
      total,
    };

    const { data, error } = await supabase.from("invoices").update(payload).eq("id", id).select("*").single();

    setSaving(false);
    if (error) return setErrorMsg(error.message);

    setInvoice(data);
    setEditOpen(false);
  };

  // Share helpers
  const invoiceUrl = typeof window !== "undefined" ? `${window.location.origin}/app/invoices/${id}` : "";

  const shareText = `Invoice ${invoiceNumber}\nTotal: ${formatMoney(total)}\n${invoiceUrl}`;

  const shareData = {
    title: `Invoice ${invoiceNumber}`,
    text: `Invoice ${invoiceNumber} • Total: ${formatMoney(total)}`,
    url: invoiceUrl,
  };

  // Only use native share on MOBILE
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const canNativeShare = isMobile && typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");

  const shareEmail = () => {
    window.location.href =
      `mailto:${encodeURIComponent(receiverEmail || "")}` +
      `?subject=${encodeURIComponent(`Invoice ${invoiceNumber}`)}` +
      `&body=${encodeURIComponent(
        `Hi ${receiverName || ""},\n\nHere is your invoice:\n${invoiceUrl}\n\nTotal: ${formatMoney(total)}\n\nThanks!`
      )}`;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(invoiceUrl);
  };

  // PDF "download" = open print dialog, user can "Save as PDF"
  const downloadPdf = () => {
    setShareOpen(false);
    window.print();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto w-full max-w-[800px]">
          <div className="h-10 w-72 rounded-xl bg-gray-200 animate-pulse" />
          <div className="mt-6 h-96 rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Invoice not found</p>
          {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
          <button
            onClick={() => router.push("/app/invoices")}
            className="mt-6 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to invoices
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <style>{`
        @media print {
          @media print {

    @page {
      size: A4;
      margin: 20mm;
    }

    html, body {
      width: 210mm;
      height: 297mm;
      background: white !important;
    }

    body {
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }

    .print-sheet {
      box-shadow: none !important;
      border: none !important;
      width: 100% !important;
    }
  

          body { background: white !important; }
          .print-sheet { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl">
        {/* Top bar */}
        <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/app/invoices")}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
          >
            ← Back
          </button>

          <div className="flex flex-wrap gap-3">
           <button
                onClick={() => router.push(`/app/invoices/${id}/edit`)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                Edit
        </button>


            <button
              type="button"
              onClick={downloadPdf}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
              title="Download PDF (opens print dialog)"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>

            {/* Share/Send */}
            <div ref={shareRef} className="relative">
              <button
                type="button"
                onClick={async () => {
                  if (canNativeShare) {
                    try {
                      await navigator.share(shareData);
                      return;
                    } catch {
                      return;
                    }
                  }
                  setShareOpen((v) => !v);
                }}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
              >
                Share / Send
              </button>

              {shareOpen && (
                <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="px-4 py-3 text-xs font-semibold text-gray-500">SHARE</div>

                  <button
                    type="button"
                    onClick={() => {
                      shareWhatsApp();
                      setShareOpen(false);
                    }}
                    className="cursor-pointer w-full px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                  >
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      shareEmail();
                      setShareOpen(false);
                    }}
                    className="cursor-pointer w-full px-4 py-3 text-left text-smfont-medium text-gray-900 hover:bg-gray-50"
                  >
                    Email
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await copyLink();
                      setShareOpen(false);
                    }}
                    className="cursor-pointer w-full px-4 py-3 text-left text-smfont-medium text-gray-900 hover:bg-gray-50"
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="no-print mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        {/* Invoice sheet (print-ready) */}
          <div className="print-sheet bg-white p-10 sm:p-12">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
              <p className="mt-1 text-sm text-gray-600">{invoiceNumber}</p>
              <p className="mt-2 text-sm text-gray-600">Date: {formatDate(invoice.created_at)}</p>
            </div>

            {/* Logo + total */}
            <div className="text-right">
              <div className="ml-auto flex h-16 w-44 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                {senderLogoUrl ? (
                  <img src={senderLogoUrl} alt="Business logo" className="h-14 w-auto object-contain" />
                ) : (
                  <span className="text-xs font-semibold text-gray-400">Your logo</span>
                )}
              </div>

              <span className="mt-3 inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                {(status || "draft").toUpperCase()}
              </span>

              <p className="mt-3 text-2xl font-bold text-gray-900">{formatMoney(total)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>

          {/* From / Bill To */}
          <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500">BILL TO</p>

              <p className="mt-2 font-semibold text-gray-900">
                {receiverCompany || receiverName || "—"}
              </p>

              {receiverCompany && receiverName ? (
                <p className="text-gray-700">{receiverName}</p>
              ) : null}

              <p className="text-gray-600">{receiverEmail || "—"}</p>

              <p className="whitespace-pre-line text-gray-600">{receiverAddress || "—"}</p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500">FROM</p>

              <p className="mt-2 font-semibold text-gray-900">{senderCompany || "—"}</p>
              <p className="text-gray-600">{senderEmail || "—"}</p>
              <p className="whitespace-pre-line text-gray-600">{senderAddress || "—"}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
            <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-600">
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
                    <div className="col-span-6 text-gray-900">{it.description || "—"}</div>
                    <div className="col-span-2 text-right text-gray-700">{it.qty || 0}</div>
                    <div className="col-span-2 text-right text-gray-700">{formatMoney(it.rate)}</div>
                    <div className="col-span-2 text-right font-semibold text-gray-900">{formatMoney(amount)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax ({Number(taxRate || 0)}%)</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>

          <p className="mt-10 text-xs text-gray-500">Generated by Invoice Generator</p>
        </div>

        {/* Edit panel */}
        {editOpen && (
          <div className="no-print mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Edit invoice</h2>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="cursor-pointer rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>

            <div className="mt-4 grid gap-6">
              <Field label="Invoice #" value={invoiceNumber} onChange={setInvoiceNumber} />

              {/* Sender */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Your business</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Company name" value={senderCompany} onChange={setSenderCompany} />
                  <Field label="Email" value={senderEmail} onChange={setSenderEmail} />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                  />
                </div>
                <div className="mt-4">
                  <Field label="Logo URL" value={senderLogoUrl} onChange={setSenderLogoUrl} />
                  <p className="mt-1 text-xs text-gray-500">
                    Tip: You can paste a URL here, or set this automatically from your upload page.
                  </p>
                </div>
              </div>

              {/* Receiver */}
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">Client</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Company name" value={receiverCompany} onChange={setReceiverCompany} />
                  <Field label="Contact name" value={receiverName} onChange={setReceiverName} />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Email" value={receiverEmail} onChange={setReceiverEmail} />
                  <Field label="Tax %" type="number" value={taxRate} onChange={setTaxRate} />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Line items</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
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
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                          className="cursor-pointer mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-40"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Tip: Download PDF opens your print dialog. Choose “Save as PDF”.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
      />
    </div>
  );
}
