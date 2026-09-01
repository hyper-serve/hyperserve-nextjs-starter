import Link from "next/link";
import { AutoRefresh } from "@/components/auto-refresh";
import { VideoPlayer } from "@/components/video-player";
import { bestReadyResolution, isSettled, loadVideo } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const loaded = await loadVideo(id);

	if (!loaded.ok) {
		return (
			<div className="py-16">
				<p className="text-sm text-red-300">Could not load this video: {loaded.message}</p>
				<Link href="/" className="mt-4 inline-block text-sm text-sky-400 underline">
					Back
				</Link>
			</div>
		);
	}

	const video = loaded.video;
	const best = bestReadyResolution(video);

	return (
		<div className="py-10">
			<AutoRefresh enabled={!isSettled(video)} />
			<Link href="/" className="text-sm text-neutral-400 hover:text-white">
				Back
			</Link>

			<div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr]">
				<div>
					{best !== null ? (
						<VideoPlayer video={video} initial={best.label} />
					) : video.status === "fail" ? (
						<div className="rounded-xl border border-red-900 bg-red-950/40 p-8 text-sm text-red-200">
							Transcoding failed for this video. Try uploading it again, or check the file plays locally.
						</div>
					) : (
						<div className="flex aspect-video items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-sm text-neutral-400">
							Transcoding. This page refreshes itself every 5 seconds.
						</div>
					)}
				</div>

				<div>
					<h2 className="text-xs uppercase tracking-wide text-neutral-500">GET /video/{"{id}"}/public</h2>
					<pre className="mt-3 max-h-[28rem] overflow-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-xs text-neutral-300">
						{JSON.stringify(video, null, 2)}
					</pre>
				</div>
			</div>
		</div>
	);
}
