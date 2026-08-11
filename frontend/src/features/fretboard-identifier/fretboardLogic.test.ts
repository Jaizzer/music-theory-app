import { describe, test, expect } from 'vitest';
import {
	getNoteAtPosition,
	generateQuestion,
	FRET_COUNT,
	OPEN_STRING_NOTES,
} from './fretboardLogic.ts';

describe('getNoteAtPosition', () => {
	test('fret 0 is the open string note', () => {
		expect(getNoteAtPosition(0, 0)).toBe('E');
		expect(getNoteAtPosition(1, 0)).toBe('B');
	});

	test('fret 12 is the same note as the open string, an octave up', () => {
		expect(getNoteAtPosition(0, 12)).toBe(getNoteAtPosition(0, 0));
	});

	test('low E string, 5th fret, is A (matches the guitarist standard-tuning reference point)', () => {
		expect(getNoteAtPosition(5, 5)).toBe('A');
	});

	test('throws on an out-of-range string index', () => {
		expect(() => getNoteAtPosition(6, 0)).toThrow();
	});
});

describe('generateQuestion', () => {
	test('always generates a question within the fretboard bounds', () => {
		for (let i = 0; i < 50; i++) {
			const question = generateQuestion();
			expect(question.stringIndex).toBeGreaterThanOrEqual(0);
			expect(question.stringIndex).toBeLessThan(OPEN_STRING_NOTES.length);
			expect(question.fret).toBeGreaterThanOrEqual(0);
			expect(question.fret).toBeLessThanOrEqual(FRET_COUNT);
			expect(() => {
				getNoteAtPosition(question.stringIndex, question.fret);
			}).not.toThrow();
		}
	});
});
