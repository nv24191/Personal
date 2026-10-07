import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFeedbackStatus, validateFeedbackSubmission, validateAdminNotes } from './feedback.js';

const games = [{ id: 'game-one', status: 'published' }, { id: 'draft-game', status: 'draft' }];

test('feedback accepts anonymous suggestions and optional issues for published games', () => {
  assert.deepEqual(validateFeedbackSubmission({
    type: 'suggestion',
    message: '  Add more games.  ',
    gameId: 'draft-game',
    deviceInfo: { browser: 'Firefox', userAgent: 'must not be collected' },
  }, games), {
    type: 'suggestion',
    gameId: null,
    message: 'Add more games.',
    deviceInfo: { browser: 'Firefox' },
  });
  assert.equal(validateFeedbackSubmission({
    type: 'issue',
    gameId: 'game-one',
    message: 'It freezes.',
  }, games).gameId, 'game-one');
  assert.equal(validateFeedbackSubmission({ type: 'issue', message: 'No specific game.' }, games).gameId, null);
});

test('feedback validates required fields, game IDs, field lengths, and private note/status values', () => {
  assert.throws(() => validateFeedbackSubmission({ type: 'other', message: 'Hello there' }, games), /Choose Suggestion or Issue/);
  assert.throws(() => validateFeedbackSubmission({ type: 'issue', message: '   ' }, games), /Message is required/);
  assert.throws(() => validateFeedbackSubmission({ type: 'issue', gameId: 'draft-game', message: 'A valid issue.' }, games), /current public library/);
  assert.throws(() => validateFeedbackSubmission({ type: 'suggestion', message: 'x'.repeat(5001) }, games), /5,000 characters/);
  assert.throws(() => validateFeedbackStatus('deleted'), /valid feedback status/);
  assert.throws(() => validateAdminNotes('x'.repeat(5001)), /5,000 characters/);
});
