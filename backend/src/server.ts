// The actual entrypoint (`npm run dev` / `npm start` both point here) —
// deliberately just app.listen() plus nothing else, so app.ts stays
// importable by tests without a real port ever being bound.
import app from './app.ts';
import config from './config/env.ts';

app.listen(config.port, () => {
	console.log(`Server is running on http://localhost:${config.port}`);
});
