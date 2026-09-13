import { SetupNotice } from "@/components/setup-notice";
import { WebhookDemo } from "@/components/webhook-demo";
import { WebhookSetup } from "@/components/webhook-setup";

export const dynamic = "force-dynamic";

export default function WebhooksPage() {
	if (!process.env.HYPERSERVE_API_KEY) {
		return <SetupNotice />;
	}

	return (
		<>
			<section className="pt-8">
				<div className="rounded-xl border border-neutral-800 px-4 py-3 text-sm text-neutral-300">
					This is the recommended production api integration. After the video is uploaded, transcoding is asynchronous,
					Hyperserve notifies your server when it finishes with a webhook. The payload carries a playable URL per
					resolution, so this page never polls getVideo for status. Needs the setup below.
				</div>
			</section>
			<WebhookSetup secretConfigured={Boolean(process.env.HYPERSERVE_WEBHOOK_SECRET)} />
			<WebhookDemo />
		</>
	);
}
