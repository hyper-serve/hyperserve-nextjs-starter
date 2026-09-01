"use client";

import { useState } from "react";

const RECEIVER_PATH = "/api/hyperserve/webhook";

export function ReceiverUrl() {
	const [host, setHost] = useState("");
	const [copied, setCopied] = useState(false);
	const trimmed = host.trim().replace(/\/+$/, "");
	const url = trimmed === "" ? null : `${trimmed.startsWith("http") ? trimmed : `https://${trimmed}`}${RECEIVER_PATH}`;

	function copy() {
		if (url === null) {
			return;
		}
		navigator.clipboard
			.writeText(url)
			.then(() => setCopied(true))
			.catch(() => {
				// Clipboard access can fail or be unavailable (e.g. an insecure context).
				// The URL above is still selectable text, so failing quietly is fine.
			});
	}

	return (
		<div className="rounded-xl border border-neutral-800 p-5">
			<label htmlFor="tunnel-host" className="text-xs uppercase tracking-wide text-neutral-500">
				Your tunnel URL
			</label>
			<input
				id="tunnel-host"
				value={host}
				onChange={(event) => {
					setHost(event.target.value);
					setCopied(false);
				}}
				placeholder="https://something-random.trycloudflare.com"
				className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600"
			/>

			{url !== null ? (
				<div className="mt-4 flex items-center gap-3">
					<code className="flex-1 overflow-x-auto rounded-lg bg-neutral-900 px-3 py-2 text-xs text-sky-300">{url}</code>
					<button
						type="button"
						onClick={copy}
						className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-neutral-900"
					>
						{copied ? "Copied" : "Copy"}
					</button>
					<span role="status" className="sr-only">
						{copied ? "Receiver URL copied to clipboard." : ""}
					</span>
				</div>
			) : null}
		</div>
	);
}
