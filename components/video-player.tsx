/** A ready rendition, from either getVideo or a webhook payload. Both carry the
 *  same shape: a playable URL and the thumbnails generated alongside it. */
export interface Rendition {
	videoUrl: string;
	thumbnailImageUrls?: string[];
}

/** Shared by both demos so they differ only in how they learn the video is ready. */
export function VideoPlayer({ rendition, failed }: { rendition: Rendition | null; failed?: boolean }) {
	if (rendition) {
		// muted is required: browsers block autoplay that has sound.
		return (
			<video
				controls
				autoPlay
				muted
				playsInline
				poster={rendition.thumbnailImageUrls?.[0]}
				src={rendition.videoUrl}
				className="w-full rounded-xl bg-black"
			/>
		);
	}

	return (
		<div className="flex aspect-video items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-400">
			{failed ? "Transcoding failed for this video." : "Transcoding..."}
		</div>
	);
}

export function RawResponse({ title, value }: { title: string; value: unknown }) {
	return (
		<div className="min-w-0">
			<h3 className="text-xs uppercase tracking-wide text-neutral-500">{title}</h3>
			<pre className="mt-3 max-h-[28rem] overflow-y-auto whitespace-pre-wrap break-all rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-xs text-neutral-300">
				{value === null ? "Waiting..." : JSON.stringify(value, null, 2)}
			</pre>
		</div>
	);
}
