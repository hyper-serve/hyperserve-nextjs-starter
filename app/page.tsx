import Link from "next/link";
import { QuickStartDemo } from "@/components/quick-start-demo";
import { SetupNotice } from "@/components/setup-notice";

export const dynamic = "force-dynamic";

export default function QuickStartPage() {
	if (!process.env.HYPERSERVE_API_KEY) {
		return <SetupNotice />;
	}

	return (
		<>
			<section className="pt-8">
				<div className="rounded-xl border border-sky-900 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">
					This is the quickest way to get started. After the video uploads and transcoding starts it polls for video
					status on GET /video/id/public. For production you should use{" "}
					<Link href="/webhooks" className="underline underline-offset-4">
						Webhooks
					</Link>{" "}
					to integrate fully.
				</div>
			</section>
			<QuickStartDemo />
		</>
	);
}
