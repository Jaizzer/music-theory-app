// Core fretboard note math, shared by both fretboard games
// (fretboard-identifier and scale-degree) — promoted here for the same
// reason getUserById.ts lives in the backend's shared services/ layer:
// used by two features, so it belongs to neither one specifically.
export const CHROMATIC_NOTES = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B',
] as const;

export type Note = (typeof CHROMATIC_NOTES)[number];

// Standard tuning, string index 0 = high E (top of the fretboard as drawn)
// through index 5 = low E (bottom).
export const OPEN_STRING_NOTES: readonly Note[] = [
	'E',
	'B',
	'G',
	'D',
	'A',
	'E',
];

export const FRET_COUNT = 12;

export function getNoteAtPosition(stringIndex: number, fret: number): Note {
	const openNote = OPEN_STRING_NOTES[stringIndex];
	if (openNote === undefined) {
		throw new Error(`Invalid string index ${String(stringIndex)}.`);
	}

	const openIndex = CHROMATIC_NOTES.indexOf(openNote);
	const note = CHROMATIC_NOTES[(openIndex + fret) % 12];
	if (note === undefined) {
		throw new Error('Note lookup failed.');
	}

	return note;
}

// The pitch class (0-11) at a position, independent of octave — this is
// all scale-degree's interval math needs: the semitone *distance* between
// two positions, which only depends on their pitch classes mod 12.
export function semitoneClassAt(stringIndex: number, fret: number): number {
	const openNote = OPEN_STRING_NOTES[stringIndex];
	if (openNote === undefined) {
		throw new Error(`Invalid string index ${String(stringIndex)}.`);
	}
	return (CHROMATIC_NOTES.indexOf(openNote) + fret) % 12;
}
