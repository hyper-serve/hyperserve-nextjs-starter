export function SetupNotice() {
	return (
		<div className="mx-auto max-w-xl py-16">
			<h2 className="text-2xl font-semibold text-white">Add your API key to get started</h2>
			<ol className="mt-6 space-y-3 text-sm text-neutral-300">
				<li>1. Copy .env.example to .env.local</li>
				<li>
					2. Paste your key from{" "}
					<a className="text-sky-400 underline" href="https://hyperserve.io/api-keys" target="_blank" rel="noreferrer">
						hyperserve.io/api-keys
					</a>{" "}
					as HYPERSERVE_API_KEY
				</li>
				<li>3. Restart the dev server</li>
			</ol>
		</div>
	);
}
