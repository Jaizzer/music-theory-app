import { describe, test, expect } from 'vitest';
import {
	computeDegree,
	generateQuestion,
	DEGREES,
} from './scaleDegreeLogic.ts';
import { FRET_COUNT, OPEN_STRING_NOTES } from '../../lib/fretboardPositions.ts';

describe('computeDegree', () => {
	test('same position (0 semitones) is the root, "1"', () => {
		expect(
			computeDegree({
				rootStringIndex: 0,
				rootFret: 5,
				targetStringIndex: 0,
				targetFret: 5,
			}),
		).toBe('1');
	});

	test('low E open to A string open is a perfect 4th, "4" (5 semitones)', () => {
		// stringIndex 5 = low E, stringIndex 4 = A string, standard tuning.
		expect(
			computeDegree({
				rootStringIndex: 5,
				rootFret: 0,
				targetStringIndex: 4,
				targetFret: 0,
			}),
		).toBe('4');
	});

	test('7 semitones up is a perfect 5th, "5"', () => {
		expect(
			computeDegree({
				rootStringIndex: 5,
				rootFret: 0,
				targetStringIndex: 5,
				targetFret: 7,
			}),
		).toBe('5');
	});

	test('wraps correctly when the target is "before" the root on the same string', () => {
		// 7 semitones down == 5 semitones up (mod 12) == a perfect 4th, "4".
		expect(
			computeDegree({
				rootStringIndex: 5,
				rootFret: 7,
				targetStringIndex: 5,
				targetFret: 0,
			}),
		).toBe('4');
	});
});

describe('generateQuestion', () => {
	test('always generates positions within the fretboard bounds', () => {
		for (let i = 0; i < 50; i++) {
			const question = generateQuestion();
			for (const stringIndex of [
				question.rootStringIndex,
				question.targetStringIndex,
			]) {
				expect(stringIndex).toBeGreaterThanOrEqual(0);
				expect(stringIndex).toBeLessThan(OPEN_STRING_NOTES.length);
			}
			for (const fret of [question.rootFret, question.targetFret]) {
				expect(fret).toBeGreaterThanOrEqual(0);
				expect(fret).toBeLessThanOrEqual(FRET_COUNT);
			}
		}
	});

	test('root and target are never the same position', () => {
		for (let i = 0; i < 50; i++) {
			const question = generateQuestion();
			const samePosition =
				question.rootStringIndex === question.targetStringIndex &&
				question.rootFret === question.targetFret;
			expect(samePosition).toBe(false);
		}
	});

	test('every generated question has a computable, valid degree', () => {
		const validNames = new Set(DEGREES.map((d) => d.name));
		for (let i = 0; i < 50; i++) {
			const question = generateQuestion();
			expect(validNames.has(computeDegree(question))).toBe(true);
		}
	});
});
