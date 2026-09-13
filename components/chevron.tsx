/** Rotates when the <details> it sits in opens, so a row reads as expandable.
 *  Needs `group` on that <details>. */
export function Chevron() {
	return (
		<svg
			viewBox="0 0 12 12"
			aria-hidden="true"
			className="size-3 shrink-0 text-neutral-500 transition-transform group-open:rotate-90"
		>
			<path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}
