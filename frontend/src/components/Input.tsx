import type { InputHTMLAttributes } from 'react';

// The one text-input styling every form composes with, instead of each
// component hand-writing its own className string — promoted once a third
// consumer (ResetPasswordPage) was about to duplicate it, the same
// "promote on third use" rule already applied to Card/Button/Badge.
export default function Input({
	className = '',
	...rest
}: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			className={`block w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:border-accent focus:outline-none ${className}`}
			{...rest}
		/>
	);
}
