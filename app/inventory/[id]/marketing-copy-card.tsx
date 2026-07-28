"use client";

import { useState, useTransition } from "react";
import { setMarketingApproval } from "./marketing-actions";

export function MarketingCopyCard({
  vehicleId,
  channel,
  title,
  content,
  initialStatus,
}: {
  vehicleId: number;
  channel: string;
  title: string;
  content: string;
  initialStatus: string;
}) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  async function copyContent() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function toggleApproval() {
    const nextStatus = status === "Approved" ? "Draft" : "Approved";
    setStatus(nextStatus);
    startTransition(async () => {
      try {
        await setMarketingApproval(vehicleId, channel, nextStatus);
      } catch {
        setStatus(status);
      }
    });
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-blue-300">{title}</h3>
          <p className={`mt-1 text-xs font-semibold ${status === "Approved" ? "text-green-300" : "text-yellow-300"}`}>
            {status}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copyContent} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-800">
            {copied ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={toggleApproval} disabled={pending} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold disabled:opacity-60">
            {pending ? "Saving..." : status === "Approved" ? "Return to Draft" : "Approve"}
          </button>
        </div>
      </div>
      <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-300">{content}</pre>
    </article>
  );
}