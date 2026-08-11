// Ported from ../scale-degree's actual mechanic (distinct from
// fretboard-identifier's note-naming game): a root position and a target
// position are shown on the fretboard, and the player identifies the
// interval — expressed as a scale degree — between them. Range/reach
// settings from the original prototype aren't replicated, same
// simplification already applied to the other two games: a fixed fret
// range (0-FRET_COUNT) is enough for the core mechanic.
import {
	OPEN_STRING_NOTES,
	FRET_COUNT,
	semitoneClassAt,
} from '../../lib/fretboardPositions.ts';

export const DEGREES = [
	{ name: '1', semitones: 0 },
	{ name: 'b2', semitones: 1 },
	{ name: '2', semitones: 2 },
	{ name: 'b3', semitones: 3 },
	{ name: '3', semitones: 4 },
	{ name: '4', semitones: 5 },
	{ name: 'b5', semitones: 6 },
	{ name: '5', semitones: 7 },
	{ name: 'b6', semitones: 8 },
	{ name: '6', semitones: 9 },
	{ name: 'b7', semitones: 10 },
	{ name: '7', semitones: 11 },
] as const;

export type DegreeName = (typeof DEGREES)[number]['name'];

export interface ScaleDegreeQuestion {
	rootStringIndex: number;
	rootFret: number;
	targetStringIndex: number;
	targetFret: number;
}

// Recomputed from the raw position pair rather than stored on the question
// itself — same pattern as mode-drill's computeModeAnswer: the question is
// just the parameters, the answer is derived, so there's exactly one place
// that can disagree with itself.
export function computeDegree(question: ScaleDegreeQuestion): DegreeName {
	const diff =
		semitoneClassAt(question.targetStringIndex, question.targetFret) -
		semitoneClassAt(question.rootStringIndex, question.rootFret);
	const normalized = ((diff % 12) + 12) % 12;

	const degree = DEGREES.find(
		(candidate) => candidate.semitones === normalized,
	);
	if (!degree) {
		throw new Error(`No degree found for ${String(normalized)} semitones.`);
	}
	return degree.name;
}

function pickRandom<T>(items: readonly T[]): T {
	const item = items[Math.floor(Math.random() * items.length)];
	if (item === undefined) {
		throw new Error('Cannot pick a random item from an empty array.');
	}
	return item;
}

const MAX_GENERATION_ATTEMPTS = 500;

export function generateQuestion(): ScaleDegreeQuestion {
	const targetDegree = pickRandom(DEGREES);

	for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
		const question: ScaleDegreeQuestion = {
			rootStringIndex: Math.floor(
				Math.random() * OPEN_STRING_NOTES.length,
			),
			rootFret: Math.floor(Math.random() * (FRET_COUNT + 1)),
			targetStringIndex: Math.floor(
				Math.random() * OPEN_STRING_NOTES.length,
			),
			targetFret: Math.floor(Math.random() * (FRET_COUNT + 1)),
		};

		const isSamePosition =
			question.rootStringIndex === question.targetStringIndex &&
			question.rootFret === question.targetFret;
		if (isSamePosition) {
			continue;
		}

		if (computeDegree(question) === targetDegree.name) {
			return question;
		}
	}

	throw new Error('Could not generate a valid scale-degree question.');
}
