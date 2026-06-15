import crypto from "node:crypto";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function nowIso() {
  return new Date().toISOString();
}

function addMs(dateString, ms) {
  return new Date(new Date(dateString).getTime() + ms).toISOString();
}

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

export function cleanupSessions(store) {
  const now = Date.now();
  store.sessions = (store.sessions || []).filter((session) => {
    const expiresAt = new Date(session.expiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > now;
  });
  return store;
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return null;
}

export function getActorFromRequest(req, store) {
  cleanupSessions(store);

  const token = getTokenFromRequest(req);
  if (token) {
    const session = (store.sessions || []).find((item) => item.token === token);
    if (!session) {
      return null;
    }

    return store.users.find((user) => user.id === session.userId) || null;
  }

  const rawUserId = req.headers["x-bom-user-id"];
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  if (!userId) {
    return null;
  }

  return store.users.find((user) => user.id === userId) || null;
}

export function createSession(store, userId) {
  cleanupSessions(store);

  const createdAt = nowIso();
  const session = {
    id: `sess-${crypto.randomUUID()}`,
    token: crypto.randomBytes(24).toString("hex"),
    userId,
    createdAt,
    expiresAt: addMs(createdAt, SESSION_TTL_MS)
  };

  store.sessions = (store.sessions || []).filter((item) => item.userId !== userId);
  store.sessions.push(session);
  return session;
}

export function clearSession(store, token) {
  if (!token) {
    return false;
  }

  const before = (store.sessions || []).length;
  store.sessions = (store.sessions || []).filter((session) => session.token !== token);
  return store.sessions.length !== before;
}
