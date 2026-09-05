import { ProfileConfig } from './ProfileConfig';

/**
 * A fresh id for a session. `crypto.randomUUID` exists in the Electron
 * renderer and in Node; the fallback is for any runtime without it.
 */
export function newSessionId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c !== undefined && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
