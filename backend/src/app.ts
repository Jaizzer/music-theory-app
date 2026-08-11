// Assembles the Express app — every request that reaches the process
// passes through this file's middleware chain, top to bottom, until
// something sends a response. server.ts is the only thing that actually
// starts listening; keeping that split means this file (and therefore the
// whole app) can be imported into a test file and driven with supertest
// without ever binding a port.
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.ts';
import healthRoutes from './api/v1/health/health.route.ts';
import userRoutes from './api/v1/users/users.route.ts';
import gameAttemptRoutes from './api/v1/game-attempts/game-attempts.route.ts';
import streakRoutes from './api/v1/streaks/streaks.route.ts';
import friendRoutes from './api/v1/friends/friends.route.ts';
import errorHandler from './middleware/errorHandler.ts';

const app = express();

// `origin: true` reflects whatever Origin sent the request (required to
// combine with `credentials: true`, since a literal wildcard "*" is
// rejected by browsers once credentials are involved). This is what lets
// the frontend's session cookie survive a cross-origin request at all —
// pair it with a specific domain instead of reflecting everything once
// there's a real production frontend origin to pin it to.
app.use(cors({ origin: true, credentials: true }));

// Better Auth's handler owns everything under this path (sign-up, sign-in,
// sign-out, session, etc.) and must be mounted BEFORE express.json(): it
// reads the raw request body itself, and express.json() would have already
// consumed that stream by the time it got here.
app.all('/api/v1/authentication/{*any}', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/game-attempts', gameAttemptRoutes);
app.use('/api/v1/streaks', streakRoutes);
app.use('/api/v1/friends', friendRoutes);

// Registered last on purpose: Express only treats a middleware as an error
// handler if it's declared with 4 arguments AND appears after the routes it
// should catch errors from.
app.use(errorHandler);

export default app;
