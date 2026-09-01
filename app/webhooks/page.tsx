import { AutoRefresh } from "@/components/auto-refresh";
import { ReceiverUrl } from "@/components/receiver-url";
import { readConfig } from "@/lib/config";
import { listWebhookLogEntries } from "@/lib/webhook-log";

export const dynamic = "force-dynamic";

export default function WebhooksPage() {
	const entries = listWebhookLogEntries();
	const config = readConfig();
	const missingApiKey = config === null;
	const missingSecret = !missingApiKey && config.webhookSecret == null;

	return (
		<div className="py-10">
			<AutoRefresh enabled intervalMs={3000} />
			<h1 className="text-xl font-semibold text-white">Webhooks</h1>
			<p className="mt-2 max-w-2xl text-sm text-neutral-400">
				Hyperserve posts an event when transcoding finishes. This page shows what arrived at
				<code className="mx-1 rounded bg-neutral-800 px-1.5 py-0.5 text-xs">/api/hyperserve/webhook</code>
				and whether the signature verified.
			</p>

			{missingApiKey ? (
				<p className="mt-6 rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
					HYPERSERVE_API_KEY is not set. Add it to .env.local and restart the dev server before continuing here.
				</p>
			) : null}

			{missingSecret ? (
				<p className="mt-6 rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
					HYPERSERVE_WEBHOOK_SECRET is not set, so incoming events cannot be verified. Add it to .env.local and
					restart the dev server.
				</p>
			) : null}

			{entries.length === 0 ? <Setup /> : null}

			<div className="mt-8 space-y-3">
				{entries.map((entry) => (
					<details key={entry.id} className="rounded-xl border border-neutral-800 p-4">
						<summary className="flex cursor-pointer items-center gap-3 text-sm">
							<span
								className={`rounded-full px-2 py-0.5 text-xs ${
									entry.verified ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
								}`}
							>
								{entry.verified ? "verified" : "rejected"}
							</span>
							<span className="text-neutral-200">{describeEvent(entry)}</span>
							<span className="font-mono text-xs text-neutral-500">{entry.videoId?.slice(0, 8) ?? ""}</span>
							<span className="ml-auto text-xs text-neutral-600">{entry.receivedAt}</span>
						</summary>
						{entry.note !== null ? <p className="mt-3 text-xs text-amber-300">{entry.note}</p> : null}
						<pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-300">
							{formatBody(entry.rawBody)}
						</pre>
					</details>
				))}
			</div>
		</div>
	);
}

function formatBody(rawBody: string): string {
	try {
		return JSON.stringify(JSON.parse(rawBody), null, 2);
	} catch {
		return rawBody;
	}
}

// entry.event is null in two different situations: the body was not JSON at
// all, or it parsed fine but had no string "event" field. Those call for
// different next steps, so label them differently rather than collapsing both
// into "unparseable body".
function describeEvent(entry: { event: string | null; rawBody: string }): string {
	if (entry.event !== null) {
		return entry.event;
	}
	try {
		JSON.parse(entry.rawBody);
		return "no event field";
	} catch {
		return "unparseable body";
	}
}

function Setup() {
	return (
		<div className="mt-8 space-y-5">
			<ol className="space-y-4 text-sm text-neutral-300">
				<li>
					<span className="text-neutral-500">1.</span> Expose your dev server. Cloudflare quick tunnels need no
					account:
					<pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-sky-300">
						npx cloudflared tunnel --url http://localhost:3000
					</pre>
					<span className="text-xs text-neutral-500">ngrok works too if you already have it configured.</span>
				</li>
				<li>
					<span className="text-neutral-500">2.</span> Paste the tunnel URL below to build your receiver URL.
				</li>
				<li>
					<span className="text-neutral-500">3.</span> Register the receiver URL from step 2 (not the bare tunnel
					URL) at{" "}
					<a className="text-sky-400 underline" href="https://hyperserve.io/webhooks" target="_blank" rel="noreferrer">
						hyperserve.io/webhooks
					</a>
					, then copy the secret it shows once into HYPERSERVE_WEBHOOK_SECRET and restart the dev server.
				</li>
				<li>
					<span className="text-neutral-500">4.</span> Upload a video. The event lands here when transcoding
					finishes.
				</li>
			</ol>
			<ReceiverUrl />
		</div>
	);
}
