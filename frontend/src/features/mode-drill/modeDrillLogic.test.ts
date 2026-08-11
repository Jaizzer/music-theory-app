import { describe, test, expect } from 'vitest';
import {
	computeModeAnswer,
	generateQuestion,
	ordinal,
} from './modeDrillLogic.ts';

describe('computeModeAnswer', () => {
	test('C Major, 1st degree, is C Ionian', () => {
		expect(
			computeModeAnswer({
				rootNote: 'C',
				parentType: 'Major',
				degreeIndex: 0,
			}),
		).toEqual({ note: 'C', modeName: 'Ionian' });
	});

	test('C Major, 2nd degree, is D Dorian', () => {
		expect(
			computeModeAnswer({
				rootNote: 'C',
				parentType: 'Major',
				degreeIndex: 1,
			}),
		).toEqual({ note: 'D', modeName: 'Dorian' });
	});

	test('C Major, 7th degree, is B Locrian', () => {
		expect(
			computeModeAnswer({
				rootNote: 'C',
				parentType: 'Major',
				degreeIndex: 6,
			}),
		).toEqual({ note: 'B', modeName: 'Locrian' });
	});

	test('A Minor, 1st degree, is A Aeolian (Natural Minor is Aeolian of itself)', () => {
		expect(
			computeModeAnswer({
				rootNote: 'A',
				parentType: 'Minor',
				degreeIndex: 0,
			}),
		).toEqual({ note: 'A', modeName: 'Aeolian' });
	});

	test('A Minor, 3rd degree, is C Ionian (relative major)', () => {
		expect(
			computeModeAnswer({
				rootNote: 'A',
				parentType: 'Minor',
				degreeIndex: 2,
			}),
		).toEqual({ note: 'C', modeName: 'Ionian' });
	});

	test('wraps around the octave (G Major, 5th degree, is D Mixolydian)', () => {
		expect(
			computeModeAnswer({
				rootNote: 'G',
				parentType: 'Major',
				degreeIndex: 4,
			}),
		).toEqual({ note: 'D', modeName: 'Mixolydian' });
	});
});

describe('generateQuestion', () => {
	test('only picks degrees from the allowed set', () => {
		for (let i = 0; i < 50; i++) {
			const question = generateQuestion([2, 4]);
			expect([2, 4]).toContain(question.degreeIndex);
		}
	});

	test('every generated question has a computable answer', () => {
		for (let i = 0; i < 50; i++) {
			expect(() => {
				computeModeAnswer(generateQuestion());
			}).not.toThrow();
		}
	});
});

describe('ordinal', () => {
	test.each([
		[0, '1st'],
		[1, '2nd'],
		[2, '3rd'],
		[3, '4th'],
		[6, '7th'],
	])('degree index %i -> %s', (degreeIndex, expected) => {
		expect(ordinal(degreeIndex)).toBe(expected);
	});
});
