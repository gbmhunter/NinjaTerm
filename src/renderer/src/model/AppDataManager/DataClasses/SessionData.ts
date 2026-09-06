import { ProfileConfig } from './ProfileConfig';

/**
 * A fresh id for a session: a v4 UUID. `crypto.randomUUID` exists in the
 * Electron renderer and in Node; the fallback builds the same thing from
 * `getRandomValues` for any runtime (older jsdom) without it.
 */
export function newSessionId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  const bytes = c.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * One session: a connection and everything configured around it.
 *
 * `config` is exactly what a profile always was -- connection, RX/TX/display
 * settings, macros, filters, logging, graphing -- so a session is "a profile
 * with a live connection", and several can be open at once.
 *
 * Everything in this class must be POD (plain old data) and serializable to JSON.
 */
export class SessionData {
  id: string;

  /** Shown on the session's tab. */
  name: string;

  config = new ProfileConfig();

  constructor(id: string = newSessionId(), name: string = 'Session 1') {
    this.id = id;
    this.name = name;
  }
}

/**
 * A `SessionData` as a plain object, for pushing into the live app data.
 *
 * MobX's deep conversion of the observable `sessions` array leaves class
 * instances alone, so pushing `new SessionData()` directly would make a
 * session whose settings nothing can observe (the bug `AppDataManager` guards
 * against for the whole tree). The JSON round-trip yields plain objects.
 */
export function makeSessionData(name: string, config?: ProfileConfig): SessionData {
  const data = new SessionData(newSessionId(), name);
  if (config !== undefined) {
    data.config = config;
  }
  return JSON.parse(JSON.stringify(data)) as SessionData;
}
