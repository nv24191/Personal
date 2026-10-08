import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialRoadmap,
  ensureRoadmapState,
  publicRoadmapItems,
  validateRoadmapInput,
} from './roadmap.js';

test('roadmap seeds are timestamped and state migration only runs once', () => {
  const state = {};
  assert.equal(ensureRoadmapState(state), true);
  assert.ok(state.roadmap.length >= 5);
  assert.ok(state.roadmap.every((item) => item.createdAt && item.updatedAt));
  assert.equal(ensureRoadmapState(state), false);
  assert.equal(createInitialRoadmap('2026-10-09T00:00:00.000Z')[0].createdAt, '2026-10-09T00:00:00.000Z');
});

test('roadmap input validates fields and allows partial edits', () => {
  assert.deepEqual(validateRoadmapInput({
    title: ' Game DNA ', description: ' Profile games ', status: 'planned', category: 'games', priority: 'high', internalNotes: ' internal ',
  }), {
    title: 'Game DNA', description: 'Profile games', status: 'planned', category: 'games', priority: 'high', internalNotes: 'internal',
  });
  assert.deepEqual(validateRoadmapInput({ status: 'released' }, { partial: true }), { status: 'released' });
  assert.throws(() => validateRoadmapInput({ title: 'x', description: 'y', status: 'fake' }), /supported roadmap status/);
  assert.throws(() => validateRoadmapInput({ title: 'x', description: 'y', extra: true }), /accept only/);
  assert.throws(() => validateRoadmapInput({ title: '', description: 'y' }), /Title must contain text/);
});

test('public roadmap omits internal notes and completed or archived items', () => {
  const items = [
    { id: 'shown', title: 'Shown', status: 'planned', updatedAt: '2026-10-09T00:00:00.000Z', internalNotes: 'private' },
    { id: 'released', status: 'released', updatedAt: '2026-10-09T00:00:00.000Z', internalNotes: 'private' },
    { id: 'archived', status: 'archived', updatedAt: '2026-10-09T00:00:00.000Z', internalNotes: 'private' },
  ];
  const visible = publicRoadmapItems(items);
  assert.deepEqual(visible.map((item) => item.id), ['shown']);
  assert.equal('internalNotes' in visible[0], false);
});