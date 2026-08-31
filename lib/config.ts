export const DEFAULT_BASE_URL = "https://api.hyperserve.io/api";

export interface HyperserveConfig {
	apiKey: string;
	/** Must include the /api suffix; the SDK does not add it. */
	baseUrl: string;
	/** Null when unset. Only needed for the optional webhook step. */
	webhookSecret: string | null;
}

function clean(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

export function readConfig(
	env: Record<string, string | undefined> = process.env,
): HyperserveConfig | null {
	const apiKey = clean(env.HYPERSERVE_API_KEY);
	if (apiKey === null) {
		return null;
	}
	return {
		apiKey,
		baseUrl: clean(env.HYPERSERVE_API_URL) ?? DEFAULT_BASE_URL,
		webhookSecret: clean(env.HYPERSERVE_WEBHOOK_SECRET),
	};
}
