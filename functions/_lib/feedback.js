export const feedbackStatuses = ['new', 'seen', 'working', 'resolved', 'important', 'archived'];
const schemaInitialization = new WeakMap();

export const feedbackSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS feedback_submissions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('suggestion', 'issue')),
    game_id TEXT,
    message TEXT NOT NULL,
    device_info TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'seen', 'working', 'resolved', 'important', 'archived')),
    admin_notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback_submissions (created_at)',
  'CREATE INDEX IF NOT EXISTS feedback_status_created ON feedback_submissions (status, created_at)',
  `CREATE TABLE IF NOT EXISTS feedback_rate_limits (
    client_key TEXT PRIMARY KEY,
    window_start INTEGER NOT NULL,
    request_count INTEGER NOT NULL
  )`,
];

export async function ensureFeedbackSchema(database) {
  let initialization = schemaInitialization.get(database);
  if (!initialization) {
    initialization = (async () => {
      for (const sql of feedbackSchemaStatements) {
        const result = await database.prepare(sql).run();
        if (result?.success === false) throw new Error('Could not initialize feedback storage.');
      }
    })();
    schemaInitialization.set(database, initialization);
  }
  try {
    await initialization;
  } catch (error) {
    schemaInitialization.delete(database);
    throw error;
  }
}

const maximumMessageLength = 5000;
const deviceValues = {
  deviceType: new Set(['Desktop', 'Mobile', 'Tablet', 'Unknown']),
  operatingSystem: new Set(['Windows', 'Android', 'iOS', 'macOS', 'Linux', 'Unknown']),
  browser: new Set(['Edge', 'Opera', 'Samsung Internet', 'Firefox', 'Chrome', 'Safari', 'Unknown']),
};

export function validateFeedbackSubmission(body, games) {
  if (!['suggestion', 'issue'].includes(body.type)) {
    throw Object.assign(new Error('Choose Suggestion or Issue.'), { status: 400 });
  }
  if (typeof body.message !== 'string') {
    throw Object.assign(new Error('Message is required and must be 5,000 characters or fewer.'), { status: 400 });
  }
  const message = body.message.replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim();
  if (!message || message.length > maximumMessageLength) {
    throw Object.assign(new Error('Message is required and must be 5,000 characters or fewer.'), { status: 400 });
  }
  if (body.gameId !== undefined && body.gameId !== null && body.gameId !== ''
    && (typeof body.gameId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.gameId))) {
    throw Object.assign(new Error('Choose a valid game from the library.'), { status: 400 });
  }
  const gameId = body.type === 'issue' && typeof body.gameId === 'string' && body.gameId ? body.gameId : null;
  if (gameId && !games.some((game) => game.id === gameId && game.status === 'published')) {
    throw Object.assign(new Error('Choose a game from the current public library.'), { status: 400 });
  }
  const deviceInfo = {};
  if (body.deviceInfo && typeof body.deviceInfo === 'object' && !Array.isArray(body.deviceInfo)) {
    for (const [key, values] of Object.entries(deviceValues)) {
      const value = body.deviceInfo[key];
      if (typeof value === 'string' && values.has(value)) deviceInfo[key] = value;
    }
    const resolution = body.deviceInfo.screenResolution;
    if (typeof resolution === 'string' && /^\d{1,5} × \d{1,5}$/.test(resolution)) deviceInfo.screenResolution = resolution;
    const version = body.deviceInfo.octoVersion;
    if (typeof version === 'string') deviceInfo.octoVersion = version.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 100);
  }
  return { type: body.type, gameId, message, deviceInfo };
}

export function normalizeFeedback(row) {
  return {
    id: row.id,
    type: row.type,
    gameId: row.game_id,
    message: row.message,
    deviceInfo: JSON.parse(row.device_info || '{}'),
    status: row.status,
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateFeedbackStatus(status) {
  if (!feedbackStatuses.includes(status)) {
    throw Object.assign(new Error('Choose a valid feedback status.'), { status: 400 });
  }
  return status;
}

export function validateAdminNotes(value) {
  if (typeof value !== 'string' || value.length > 5000) {
    throw Object.assign(new Error('Admin notes must be 5,000 characters or fewer.'), { status: 400 });
  }
  return value.trim();
}
