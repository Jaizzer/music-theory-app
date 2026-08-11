import { describe, test, expect } from 'vitest';
import {
	getNoteAtPosition,
	semitoneClassAt,
	FRET_COUNT,
	OPEN_STRING_NOTES,
} from './fretboardPositions.ts';

describe('getNoteAtPosition', () => {
	test('fret 0 is the open string note', () => {
		expect(getNoteAtPosition(0, 0)).toBe('E');
		expect(getNoteAtPosition(1, 0)).toBe('B');
	});

	test('fret 12 is the same note as the open string, an octave up', () => {
		expect(getNoteAtPosition(0, 12)).toBe(getNoteAtPosition(0, 0));
	});

	test('low E string, 5th fret, is A (a standard tuning reference point)', () => {
		expect(getNoteAtPosition(5, 5)).toBe('A');
	});

	test('throws on an out-of-range string index', () => {
		expect(() => getNoteAtPosition(6, 0)).toThrow();
	});
});

describe('semitoneClassAt', () => {
	test('matches getNoteAtPosition’s pitch class', () => {
		for (
			let stringIndex = 0;
			stringIndex < OPEN_STRING_NOTES.length;
			stringIndex++
		) {
			for (let fret = 0; fret <= FRET_COUNT; fret++) {
				const note = getNoteAtPosition(stringIndex, fret);
				const expectedClass = [
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
				].indexOf(note);
				expect(semitoneClassAt(stringIndex, fret)).toBe(expectedClass);
			}
		}
	});

	test('the same pitch an octave apart has the same semitone class', () => {
		expect(semitoneClassAt(0, 0)).toBe(semitoneClassAt(0, 12));
	});
});
