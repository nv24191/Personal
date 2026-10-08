export const roadmapStatuses = Object.freeze([
  { value: 'idea', label: 'Idea' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'released', label: 'Released' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
]);

export const roadmapCategories = Object.freeze([
  'games', 'community', 'content', 'operations', 'platform', 'ai', 'museum', 'analytics', 'other',
]);

export const roadmapPriorities = Object.freeze(['low', 'normal', 'high', 'urgent']);

const statusValues = new Set(roadmapStatuses.map(({ value }) => value));
const categoryValues = new Set(roadmapCategories);
const priorityValues = new Set(roadmapPriorities);
const editableFields = new Set(['title', 'description', 'status', 'category', 'priority', 'internalNotes']);

const initialRoadmap = [
  {
    id: 'octo-nexus', title: 'Octo Nexus',
    description: 'Centralize repository sync, commit history, automation status, and release snapshots.',
    status: 'in-progress', category: 'platform', priority: 'high', internalNotes: '',
  },
  {
    id: 'game-dna', title: 'Game DNA',
    description: 'Give each game a structured identity for discovery, recommendations, and analysis.',
    status: 'planned', category: 'games', priority: 'normal', internalNotes: '',
  },
  {
    id: 'ai-metadata-generator', title: 'AI Metadata Generator',
    description: 'Suggest game descriptions, tags, categories, and DNA during onboarding.',
    status: 'planned', category: 'ai', priority: 'normal', internalNotes: '',
  },
  {
    id: 'octo-museum', title: 'Octo Museum',
    description: 'Preserve retired games, historical platform states, and release snapshots.',
    status: 'planned', category: 'museum', priority: 'low', internalNotes: '',
  },
  {
    id: 'trend-forecaster', title: 'Trend Forecaster',
    description: 'Identify rising and declining games from reliable play, search, and engagement data.',
    status: 'planned', category: 'analytics', priority: 'low', internalNotes: '',
  },
  {
    id: 'offline-hub', title: 'Offline Hub',
    description: 'Make the hub and its game discovery experience available without a network connection.',
    status: 'on-hold', category: 'platform', priority: 'low', internalNotes: '',
  },
  {
    id: 'community-voting', title: 'Community Voting',
    description: 'Let players help prioritize upcoming games and platform improvements.',
    status: 'planned', category: 'community', priority: 'low', internalNotes: '',
  },
  {
    id: 'octo-news', title: 'Octo News',
    description: 'Publish platform updates and developer logs from a single content workflow.',
    status: 'planned', category: 'content', priority: 'normal', internalNotes: '',
  },
  {
    id: 'favorites', title: 'Player Favorites',
    description: 'Allow players to save a personal list of games on their device.',
    status: 'idea', category: 'games', priority: 'low', internalNotes: '',
  },
  {
    id: 'game-recommendations', title: 'Game Recommendations',
    description: 'Help players discover games using categories, tags, and future Game DNA profiles.',
    status: 'planned', category: 'ai', priority: 'low', internalNotes: '',
  },
  {
    id: 'achievements', title: 'Achievements',
    description: 'Explore lightweight milestones that work with self-hosted browser games.',
    status: 'idea', category: 'games', priority: 'low', internalNotes: '',
  },
  {
    id: 'release-snapshots', title: 'Release Snapshots',
    description: 'Keep reviewable snapshots of platform releases and preserved game versions.',
    status: 'planned', category: 'museum', priority: 'low', internalNotes: '',
  },
  {
    id: 'backup-manager', title: 'Backup Manager',
    description: 'Track and restore verified backups of catalog metadata and platform configuration.',
    status: 'planned', category: 'operations', priority: 'normal', internalNotes: '',
  },
  {
    id: 'search-analytics', title: 'Search Analytics',
    description: 'Understand which games, tags, and categories players search for without collecting unnecessary personal data.',
    status: 'planned', category: 'analytics', priority: 'low', internalNotes: '',
  },
];

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function readText(value, name, maximum, { required = false } = {}) {
  if (typeof value !== 'string') throw invalid(`${name} must be text.`);
  const result = value.trim();
  if ((required && !result) || result.length > maximum) {
    throw invalid(`${name} must contain ${required ? 'text and ' : ''}no more than ${maximum} characters.`);
  }
  return result;
}

export function validateRoadmapInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Roadmap data must be an object.');
  const entries = Object.entries(body);
  if (!entries.length || entries.some(([key]) => !editableFields.has(key))) {
    throw invalid('Roadmap items accept only title, description, status, category, priority, and internalNotes.');
  }

  const result = {};
  if (!partial || Object.hasOwn(body, 'title')) result.title = readText(body.title, 'Title', 100, { required: true });
  if (!partial || Object.hasOwn(body, 'description')) result.description = readText(body.description, 'Description', 1000, { required: true });
  if (!partial || Object.hasOwn(body, 'status')) {
    result.status = body.status ?? 'idea';
    if (!statusValues.has(result.status)) throw invalid('Choose a supported roadmap status.');
  }
  if (!partial || Object.hasOwn(body, 'category')) {
    result.category = body.category ?? 'platform';
    if (!categoryValues.has(result.category)) throw invalid('Choose a supported roadmap category.');
  }
  if (!partial || Object.hasOwn(body, 'priority')) {
    result.priority = body.priority ?? 'normal';
    if (!priorityValues.has(result.priority)) throw invalid('Choose a supported roadmap priority.');
  }
  if (!partial || Object.hasOwn(body, 'internalNotes')) {
    result.internalNotes = readText(body.internalNotes ?? '', 'Internal notes', 5000);
  }
  return result;
}

export function createInitialRoadmap(now = new Date().toISOString()) {
  return initialRoadmap.map((item) => ({ ...item, createdAt: now, updatedAt: now }));
}

export function ensureRoadmapState(state) {
  if (Array.isArray(state.roadmap)) return false;
  state.roadmap = createInitialRoadmap();
  return true;
}

export function publicRoadmapItems(items) {
  return items
    .filter((item) => !['released', 'archived'].includes(item.status))
    .map(({ internalNotes, ...item }) => item)
    .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt));
}