import { describe, test, expect } from 'vitest';
import { generateQuestion } from './fretboardLogic.ts';
import {
	getNoteAtPosition,
	FRET_COUNT,
	OPEN_STRING_NOTES,
} from '../../lib/fretboardPositions.ts';

// getNoteAtPosition itself is tested in lib/fretboardPositions.test.ts —
// this only covers what's specific to this game: generating a
// single-position question within bounds.
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
