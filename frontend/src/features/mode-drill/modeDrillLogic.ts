// The theory engine, ported from ../mode's vanilla-JS prototype
// (majorInt/minorInt/minorNames arrays) — see that project for the
// original. Kept as pure functions with no React/DOM involved so they're
// directly unit-testable (see modeDrillLogic.test.ts) without rendering
// anything.
export const NOTES = [
	'C',
	'Db',
	'D',
	'Eb',
	'E',
	'F',
	'Gb',
	'G',
	'Ab',
	'A',
	'Bb',
	'B',
] as const;

export const MODE_NAMES = [
	'Ionian',
	'Dorian',
	'Phrygian',
	'Lydian',
	'Mixolydian',
	'Aeolian',
	'Locrian',
] as const;

export type ModeName = (typeof MODE_NAMES)[number];
export type ParentType = 'Major' | 'Minor';

// Semitone offset of each mode's root from the parent scale's own tonic.
const MAJOR_PARENT_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;
const MINOR_PARENT_INTERVALS = [0, 2, 3, 5, 7, 8, 10] as const;

// The mode name found at each degree when the parent is Natural Minor —
// e.g. degree 1 of a minor parent is Aeolian, since Natural Minor *is*
// Aeolian mode of its relative major.
const MINOR_PARENT_MODE_NAMES: readonly ModeName[] = [
	'Aeolian',
	'Locrian',
	'Ionian',
	'Dorian',
	'Phrygian',
	'Lydian',
	'Mixolydian',
];

export interface ModeQuestion {
	rootNote: (typeof NOTES)[number];
	parentType: ParentType;
	degreeIndex: number; // 0-6, i.e. "1st" through "7th"
}

export interface ModeAnswer {
	note: (typeof NOTES)[number];
	modeName: ModeName;
}

function pickRandom<T>(items: readonly T[]): T {
	const item = items[Math.floor(Math.random() * items.length)];
	if (item === undefined) {
		throw new Error('Cannot pick a random item from an empty array.');
	}
	return item;
}

export function generateQuestion(
	allowedDegrees: readonly number[] = [0, 1, 2, 3, 4, 5, 6],
): ModeQuestion {
	return {
		rootNote: pickRandom(NOTES),
		parentType: pickRandom(['Major', 'Minor']),
		degreeIndex: pickRandom(allowedDegrees),
	};
}

export function computeModeAnswer(question: ModeQuestion): ModeAnswer {
	const rootIndex = NOTES.indexOf(question.rootNote);
	if (rootIndex === -1) {
		throw new Error(`Unknown root note '${question.rootNote}'.`);
	}

	const intervals =
		question.parentType === 'Major'
			? MAJOR_PARENT_INTERVALS
			: MINOR_PARENT_INTERVALS;
	const modeNames =
		question.parentType === 'Major' ? MODE_NAMES : MINOR_PARENT_MODE_NAMES;

	const interval = intervals[question.degreeIndex];
	const modeName = modeNames[question.degreeIndex];
	if (interval === undefined || modeName === undefined) {
		throw new Error(
			`Invalid degree index ${String(question.degreeIndex)}.`,
		);
	}

	const note = NOTES[(rootIndex + interval) % 12];
	if (note === undefined) {
		throw new Error('Note lookup failed.');
	}

	return { note, modeName };
}

export function ordinal(degreeIndex: number): string {
	const n = degreeIndex + 1;
	const suffixes = ['th', 'st', 'nd', 'rd'];
	const relevantDigits = n % 100;
	const suffix =
		suffixes[(relevantDigits - 20) % 10] ??
		suffixes[relevantDigits] ??
		suffixes[0];
	return `${String(n)}${suffix}`;
}
