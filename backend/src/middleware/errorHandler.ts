// Registered last in src/app.ts. Express recognizes an error-handling
// middleware by its 4-argument signature (err, req, res, next) — it's
// skipped for every normal request and only invoked when something calls
// `next(err)` or an async handler throws/rejects.
//
// On Express 5 (unlike 4), a rejected promise from an `async` route handler
// is forwarded here automatically — so route handlers don't need their own
// try/catch just to avoid crashing the process on an unhandled rejection.
import type { Request, Response, NextFunction } from 'express';

export default function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- required so Express recognizes this as error-handling middleware
	_next: NextFunction,
) {
	console.error(err);

	if (res.headersSent) {
		return;
	}

	res.status(500).json({ message: 'Internal server error.' });
}
