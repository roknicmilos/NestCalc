import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

type Listener = (event: any) => void;

/** Runs public/sw.js against stubbed service worker globals and returns its listeners. */
function loadWorker(networkFetch: (req: unknown) => Promise<unknown>, offlinePage: unknown) {
  const listeners: Record<string, Listener> = {};
  const cache = { addAll: async () => {}, match: async (url: string) => (url === '/offline.html' ? offlinePage : undefined) };
  const self = {
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };
  const caches = { open: async () => cache, match: cache.match };
  const code = readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8');
  vm.runInNewContext(code, { self, caches, fetch: networkFetch });
  return listeners;
}

function fetchEvent(request: Record<string, unknown>) {
  const responses: Promise<unknown>[] = [];
  return { request, respondWith: (p: Promise<unknown>) => responses.push(p), responses };
}

describe('service worker', () => {
  it('does not respond to non-navigation requests (e.g. PUT /api/calculator)', () => {
    const { fetch } = loadWorker(async () => 'net', 'offline');
    const event = fetchEvent({ mode: 'cors', method: 'PUT', url: '/api/calculator' });
    fetch(event);
    expect(event.responses).toHaveLength(0);
  });

  it('does not respond to GET /api requests', () => {
    const { fetch } = loadWorker(async () => 'net', 'offline');
    const event = fetchEvent({ mode: 'same-origin', method: 'GET', url: '/api/calculator' });
    fetch(event);
    expect(event.responses).toHaveLength(0);
  });

  it('serves /offline.html when a navigation fails', async () => {
    const { fetch } = loadWorker(async () => Promise.reject(new Error('offline')), 'OFFLINE_PAGE');
    const event = fetchEvent({ mode: 'navigate', method: 'GET', url: '/' });
    fetch(event);
    expect(await event.responses[0]).toBe('OFFLINE_PAGE');
  });

  it('passes through successful navigations', async () => {
    const { fetch } = loadWorker(async () => 'NETWORK_PAGE', 'OFFLINE_PAGE');
    const event = fetchEvent({ mode: 'navigate', method: 'GET', url: '/' });
    fetch(event);
    expect(await event.responses[0]).toBe('NETWORK_PAGE');
  });
});
