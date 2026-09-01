"use client";

import { putVideoToStorage } from "@hyperserve/hyperserve-js/browser";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { type UploadPhase, runUpload } from "@/lib/upload-flow";
import { ALL_RESOLUTIONS, DEFAULT_RESOLUTIONS } from "@/lib/upload-validation";

export function UploadPanel() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [phase, setPhase] = useState<UploadPhase>({ name: "idle" });
	const [error, setError] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const [resolutions, setResolutions] = useState<string[]>([...DEFAULT_RESOLUTIONS]);

	async function upload(file: File) {
		setError(null);
		try {
			const id = await runUpload(
				{ file, resolutions, onPhase: setPhase },
				{ postJson, putToStorage: putVideoToStorage },
			);
			router.push(`/videos/${id}`);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Upload failed.");
			setPhase({ name: "idle" });
		}
	}

	const busy = phase.name !== "idle";

	return (
		<section className="py-10">
			<div
				onDragOver={(event) => {
					event.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setDragging(false);
					const file = event.dataTransfer.files[0];
					if (file && !busy) void upload(file);
				}}
				className={`rounded-xl border border-dashed p-12 text-center transition ${
					dragging ? "border-sky-400 bg-sky-950/20" : "border-neutral-700"
				}`}
			>
				<p className="text-lg text-white">Drop a video here</p>
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
					accept="video/*,.mkv,.mov,.avi,.wmv,.m4v,.mpg"
					className="hidden"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) void upload(file);
						event.target.value = "";
					}}
				/>

				<p className="mt-4 text-xs text-neutral-500">
					No video handy? Use the included{" "}
					<a className="underline" href="/sample.mov" download>
						sample.mov
					</a>
					. It is a QuickTime file, and Hyperserve returns MP4 renditions.
				</p>
			</div>

			<fieldset className="mt-6">
				<legend className="text-xs uppercase tracking-wide text-neutral-500">Output resolutions</legend>
				<div className="mt-2 flex flex-wrap gap-2">
					{ALL_RESOLUTIONS.map((resolution) => {
						const selected = resolutions.includes(resolution);
						return (
							<button
								key={resolution}
								type="button"
								disabled={busy}
								onClick={() =>
									setResolutions((current) =>
										current.includes(resolution)
											? current.filter((entry) => entry !== resolution)
											: [...current, resolution],
									)
								}
								className={`rounded-full border px-3 py-1 text-xs ${
									selected ? "border-white bg-white text-neutral-900" : "border-neutral-700 text-neutral-400"
								}`}
							>
								{resolution}
							</button>
						);
					})}
				</div>
				<p className="mt-2 text-xs text-neutral-500">Each selected resolution counts against your plan&apos;s usage.</p>
			</fieldset>

			{phase.name === "uploading" ? (
				<div className="mt-6">
					<div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
						<div className="h-full bg-sky-400 transition-all" style={{ width: `${phase.percent}%` }} />
					</div>
					<p className="mt-2 text-xs text-neutral-400">Uploading, {Math.round(phase.percent)}%</p>
				</div>
			) : null}

			{phase.name === "creating" ? <p className="mt-6 text-xs text-neutral-400">Requesting an upload URL...</p> : null}
			{phase.name === "completing" ? <p className="mt-6 text-xs text-neutral-400">Queueing transcoding...</p> : null}

			{error !== null ? (
				<p className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p>
			) : null}
		</section>
	);
}

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
	const response = await fetch(url, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	const payload = await response.json();
	if (!response.ok) {
		throw new Error(typeof payload.error === "string" ? payload.error : `Request to ${url} failed.`);
	}
	return payload;
}
