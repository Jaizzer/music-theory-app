// A new game, not a port — this is deliberately simpler than
// ../scale-degree's interval-recognition mechanic: given a highlighted
// position on a virtual fretboard (the "orb"), identify the raw note name
// at that fret/string, not an interval between two points. The actual
// fretboard note math lives in ../../lib/fretboardPositions.ts — shared
// with scale-degree, which needs the same position lookups for a
// different question shape — this file only owns generating a
// single-position question, which is specific to this game.
import { OPEN_STRING_NOTES, FRET_COUNT } from '../../lib/fretboardPositions.ts';

export interface FretboardQuestion {
	stringIndex: number; // 0-5
	fret: number; // 0-FRET_COUNT
}

export function generateQuestion(): FretboardQuestion {
	return {
		stringIndex: Math.floor(Math.random() * OPEN_STRING_NOTES.length),
		fret: Math.floor(Math.random() * (FRET_COUNT + 1)),
	};
}
