import Link from "next/link";
import type { VideoResult } from "@hyperserve/hyperserve-js";
import { bestReadyResolution } from "@/lib/videos";

const STATUS_LABEL: Record<string, string> = {
	pending_upload: "Waiting for upload",
	processing: "Transcoding",
	ready: "Ready",
	fail: "Failed",
};

export function VideoCard({ video }: { video: VideoResult }) {
	const best = bestReadyResolution(video);
	const poster = best?.result.thumbnailImageUrls[0];

	return (
		<Link
			href={`/videos/${video.id}`}
			className="block overflow-hidden rounded-xl border border-neutral-800 transition hover:border-neutral-600"
		>
			<div className="aspect-video bg-neutral-900">
				{poster ? (
					// eslint-disable-next-line @next/next/no-img-element -- thumbnail host is not known at build time
					<img src={poster} alt="" className="h-full w-full object-cover" />
				) : (
					<div className="flex h-full items-center justify-center text-xs text-neutral-600">No thumbnail yet</div>
				)}
			</div>
			<div className="flex items-center justify-between px-4 py-3">
				<span className="font-mono text-xs text-neutral-500">{video.id.slice(0, 8)}</span>
				<span className={`text-xs ${video.status === "fail" ? "text-red-400" : "text-neutral-300"}`}>
					{STATUS_LABEL[video.status] ?? video.status}
				</span>
			</div>
		</Link>
	);
}
