"use client";

import type { VideoResult } from "@hyperserve/hyperserve-js";
import { useEffect, useState } from "react";
import { RawResponse, VideoPlayer } from "@/components/video-player";
import { RESOLUTIONS } from "@/lib/resolutions";

/**
 * The quick-start way. Polls GET /api/videos/[id] until the video is ready or
 * failed, then stops. Use this when you cannot receive a webhook, such as a
 * script or a dev server with no public URL. Otherwise prefer /webhooks.
 */
export function PollingVideoPanel({ id }: { id: string }) {
	const [video, setVideo] = useState<VideoResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const settled = video !== null && (video.status === "ready" || video.status === "fail");

	useEffect(() => {
		if (settled || error !== null) {
			return;
		}
		let cancelled = false;

		async function check() {
			try {
				const response = await fetch(`/api/videos/${id}`);
				if (!response.ok) {
					throw new Error(`Could not load video ${id}.`);
				}
				if (!cancelled) {
					setVideo((await response.json()) as VideoResult);
				}
			} catch (cause) {
				if (!cancelled) {
					setError(cause instanceof Error ? cause.message : "Could not load this video.");
				}
			}
		}

		void check();
		const timer = setInterval(check, 2000);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [id, settled, error]);

	const ready = video ? RESOLUTIONS.map((label) => video.resolutions[label]).find((it) => it?.status === "ready") : null;

	return (
		<section className="border-t border-neutral-800 py-10">
			<h2 className="text-xs uppercase tracking-wide text-neutral-500">Your video</h2>
			{error === null ? null : <p className="mt-2 text-sm text-red-300">{error}</p>}
			<div className="mt-4 grid gap-8 lg:grid-cols-[3fr_2fr]">
				<div className="min-w-0">
					<VideoPlayer rendition={ready ?? null} failed={video?.status === "fail"} />
				</div>
				<RawResponse title="GET /video/{id}/public" value={video} />
			</div>
		</section>
	);
}
