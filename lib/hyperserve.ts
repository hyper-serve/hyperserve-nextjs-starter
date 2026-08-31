import "server-only";
import { HyperserveClient } from "@hyperserve/hyperserve-js";
import type { HyperserveConfig } from "@/lib/config";

/**
 * The SDK defaults to zero retries. Two is enough to ride out a transient 5xx
 * without making a genuinely broken key feel slow: 4xx and timeouts are never retried.
 */
export function createClient(config: HyperserveConfig): HyperserveClient {
	return new HyperserveClient({
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		retries: 2,
	});
}
