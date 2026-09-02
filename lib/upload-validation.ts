import type { VideoResolution } from "@hyperserve/hyperserve-js";

/** Extensions the Hyperserve API derives a Content-Type from. Anything else is rejected. */
export const SUPPORTED_EXTENSIONS = [
	"avi", "m4v", "mkv", "mov", "mp4", "mpg", "webm", "wmv",
] as const;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

export const ALL_RESOLUTIONS: readonly VideoResolution[] = [
	"144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "4k", "8k",
];

/**
 * Two renditions: enough to show a resolution switcher without burning free-tier quota.
 * The bundled sample.mov is 720p, so the higher default stays at 720p rather than 1080p,
 * which would just upscale the sample instead of genuinely improving it.
 */
export const DEFAULT_RESOLUTIONS: [VideoResolution, ...VideoResolution[]] = ["480p", "720p"];

export type FileCheck = { ok: true } | { ok: false; message: string };

export function extensionOf(name: string): string | null {
	const trimmed = name.trim();
	const dot = trimmed.lastIndexOf(".");
	if (dot === -1 || dot === trimmed.length - 1) {
		return null;
	}
	return trimmed.slice(dot + 1).toLowerCase();
}

export function checkFile(input: { name: string; size: number }): FileCheck {
	const extension = extensionOf(input.name);
	if (extension === null || !(SUPPORTED_EXTENSIONS as readonly string[]).includes(extension)) {
		return {
			ok: false,
			message: `Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
		};
	}
	if (input.size <= 0) {
		return { ok: false, message: "That file is empty." };
	}
	if (input.size > MAX_FILE_SIZE_BYTES) {
		return { ok: false, message: "That file is larger than the 5 GB limit." };
	}
	return { ok: true };
}

export function isVideoResolution(value: unknown): value is VideoResolution {
	return typeof value === "string" && ALL_RESOLUTIONS.includes(value as VideoResolution);
}
