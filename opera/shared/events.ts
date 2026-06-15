import { EventEmitter } from 'events';

class SessionEventEmitter extends EventEmitter {}

// Global object to persist across hot reloads in development
const globalForEvents = global as unknown as { sessionEvents: SessionEventEmitter };

export const sessionEvents = globalForEvents.sessionEvents || new SessionEventEmitter();

if (process.env.NODE_ENV !== 'production') globalForEvents.sessionEvents = sessionEvents;
