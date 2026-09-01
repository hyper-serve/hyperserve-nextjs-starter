"use client";

import type { VideoResolution, VideoResult } from "@hyperserve/hyperserve-js";
import { useState } from "react";

export function VideoPlayer({ video, initial }: { video: VideoResult; initial: VideoResolution }) {
	const [selected, setSelected] = useState<VideoResolution>(initial);
	const ready = (Object.entries(video.resolutions) as Array<[VideoResolution, { status: string; videoUrl: string }]>)
		.filter(([, result]) => result.status === "ready" && result.videoUrl);
	const current = video.resolutions[selected];

	return (
		<div>
			<video
				key={selected}
				controls
				playsInline
				poster={current?.thumbnailImageUrls[0]}
				src={current?.videoUrl}
				className="w-full rounded-xl bg-black"
			>
				<track kind="captions" />
			</video>

			{ready.length > 1 ? (
				<div className="mt-3 flex gap-2">
					{ready.map(([label]) => (
						<button
							key={label}
							type="button"
							onClick={() => setSelected(label)}
							className={`rounded-full border px-3 py-1 text-xs ${
								label === selected ? "border-white bg-white text-neutral-900" : "border-neutral-700 text-neutral-400"
							}`}
						>
							{label}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
