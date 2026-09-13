"use client";

import type { CreateVideoResult } from "@hyperserve/hyperserve-js";
import { putVideoToStorage } from "@hyperserve/hyperserve-js/browser";
import { useRef, useState } from "react";

export function UploadPanel({ onUploaded }: { onUploaded: (id: string) => void }) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState<string | null>(null);
	const [percent, setPercent] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function upload(file: File) {
		setError(null);
		try {
			// Demo only: drop the previous video's webhook so it cannot be mistaken
			// for this one's.
			await fetch("/api/webhooks", { method: "DELETE" });

			setStatus("Requesting an upload URL");
			/*
			* 1. Call the server route to start the create a video process
			* in hyperserve and receive a presigned URL for video upload.
			* This keeps your API key safe on your server.
			*/
			const createResponse = await fetch("/api/videos", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ filename: file.name }),
			});

			if (!createResponse.ok) {
				throw new Error(`Could not create the video (status ${createResponse.status}).`);
			}

			const { id, uploadUrl, contentType } =
				(await createResponse.json()) as CreateVideoResult;

			setStatus("Uploading");
			setPercent(0);
			/*
			* 2. Upload your video to the storage bucket from the browser.
			* contentType must be exactly what createVideo returned.
			*/
			await putVideoToStorage({ uploadUrl, contentType, file, onProgress: setPercent });

			setStatus("Queueing transcoding");
			setPercent(null);
			/*
			* 3. Complete the create video process, by telling Hyperserve the upload finished.
			* This queues transcoding.
			*/
			const completeResponse = await fetch(`/api/videos/${id}/complete`, { method: "POST" });
			if (!completeResponse.ok) {
				throw new Error(`Could not queue transcoding (status ${completeResponse.status}).`);
			}

			onUploaded(id);
			setStatus(null);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Upload failed.");
			setStatus(null);
			setPercent(null);
		}
	}

	async function uploadSample() {
		setError(null);
		setStatus("Loading the sample video");
		try {
			const response = await fetch("/sample.mov");
			const blob = await response.blob();
			await upload(new File([blob], "sample.mov", { type: "video/quicktime" }));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not load the sample video.");
			setStatus(null);
		}
	}

	const busy = status !== null;

	return (
		<section className="py-10">
			<div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
				<p className="text-lg text-white">Upload a video</p>
				<p className="mt-1 text-sm text-neutral-400">mov, mp4, mkv, webm, avi, m4v, mpg, wmv. Up to 5 GB.</p>

				<button
					type="button"
					disabled={busy}
					onClick={() => inputRef.current?.click()}
					className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
				>
					{busy ? "Working..." : "Choose a file"}
				</button>

				<input
					ref={inputRef}
					type="file"
					accept="video/*"
					className="hidden"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) void upload(file);
						event.target.value = "";
					}}
				/>

				<p className="mt-4 text-xs text-neutral-500">
					No video handy?{" "}
					<button
						type="button"
						disabled={busy}
						onClick={() => void uploadSample()}
						className="underline transition hover:text-neutral-300 disabled:no-underline disabled:opacity-50"
					>
						Upload the included sample
					</button>
					. A 10-second 720p QuickTime file; Hyperserve returns MP4 renditions.
				</p>
			</div>

			<div aria-live="polite">
				{status !== null ? (
					<div className="mt-6">
						{percent !== null ? (
							<div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
								<div className="h-full bg-sky-400 transition-all" style={{ width: `${percent}%` }} />
							</div>
						) : null}
						<p className="mt-2 text-xs text-neutral-400">
							{status}
							{percent !== null ? `, ${Math.round(percent)}%` : "..."}
						</p>
					</div>
				) : null}
			</div>

			{error !== null ? (
				<p role="alert" className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
					{error}
				</p>
			) : null}
		</section>
	);
}
