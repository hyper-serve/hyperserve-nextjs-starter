import { Chevron } from "@/components/chevron";

const RECEIVER_PATH = "/api/hyperserve/webhook";

/** Collapsed by default: it sits near the top so it is easy to find, but it is
 *  reference material once you have done it. */
export function WebhookSetup({ secretConfigured }: { secretConfigured: boolean }) {
	return (
		<section className="pt-6">
			{secretConfigured ? null : (
				<p className="mb-4 rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
					HYPERSERVE_WEBHOOK_SECRET is not set, so nothing can verify. Step 3 below.
				</p>
			)}

			<details className="group rounded-xl border border-neutral-800 p-5">
				<summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
					<Chevron />
					Setup: what you need to do for webhooks to arrive
				</summary>
				<ol className="mt-4 space-y-4 text-sm text-neutral-300">
					<li>
						<p>
							<span className="text-neutral-500">1.</span> Create a public URL to this dev server. Cloudflare quick
							tunnels need no account, and the tunnel has to exist before you create the webhook:
						</p>
						<pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-sky-300">
							npx cloudflared tunnel --url http://localhost:3000
						</pre>
					</li>
					<li>
						<p>
							<span className="text-neutral-500">2.</span> Create a webhook at{" "}
							<a
								className="text-sky-400 underline"
								href="https://hyperserve.io/webhooks"
								target="_blank"
								rel="noreferrer"
							>
								hyperserve.io/webhooks
							</a>{" "}
							targeting the tunnel URL with{" "}
							<code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">{RECEIVER_PATH}</code> appended.
						</p>
					</li>
					<li>
						<p>
							<span className="text-neutral-500">3.</span> Copy the signing secret into{" "}
							<code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">.env.local</code> as{" "}
							<code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">HYPERSERVE_WEBHOOK_SECRET</code>, then
							restart the dev server.
						</p>
					</li>
					<li>
						<p>
							<span className="text-neutral-500">4.</span> Upload a video. When transcoding finishes we will POST to
							your webhook url with event metadata.
						</p>
					</li>
				</ol>
			</details>
		</section>
	);
}
