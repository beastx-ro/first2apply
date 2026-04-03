import { SiteProvider, WebPageRuntimeData } from '@first2apply/core';
import { createHash } from 'crypto';
import { Session } from 'electron';

/**
 * Main-process store for runtime data captured by the protocol handler,
 * keyed by the request URL.
 */
const runtimeDataStore = new Map<string, WebPageRuntimeData>();

/** Maximum number of entries to keep in the store. */
const MAX_STORE_SIZE = 200;

/**
 * Extract the raw content of the `<script id="rehydrate-data">` tag from HTML.
 * Returns the script text as-is so the backend can handle parsing/eval.
 */
function extractRehydrationScript(html: string): string | undefined {
  const scriptMatch = html.match(/<script[^>]+id\s*=\s*["']rehydrate-data["'][^>]*>([\s\S]*?)<\/script>/);
  return scriptMatch?.[1];
}

/**
 * Install a protocol handler on the given session that intercepts the initial
 * LinkedIn HTML response to capture the Como rehydration data before React
 * hydration consumes and removes the `<script id="rehydrate-data">` tag.
 *
 * The captured data is stored in main-process memory and can be retrieved
 * via `consumeRuntimeData(url)`.
 */
export function installLinkedInDecorator(session: Session): void {
  session.protocol.handle('https', async (request) => {
    const isGet = request.method === 'GET';
    const destination = request.headers.get('sec-fetch-dest');
    const accept = request.headers.get('accept') ?? '';
    const looksLikeDocument = destination === 'document' || accept.includes('text/html');

    // Pass through non-document requests immediately
    if (!isGet || !looksLikeDocument) {
      return session.fetch(request, { bypassCustomProtocolHandlers: true });
    }

    const response = await session.fetch(request, { bypassCustomProtocolHandlers: true });

    // Only process LinkedIn job pages that return HTML
    const contentType = response.headers.get('content-type') ?? '';
    if (!request.url.includes('linkedin.com/jobs') || !contentType.includes('text/html')) {
      return response;
    }

    const rawHtml = await response.text();
    const rehydrationScript = extractRehydrationScript(rawHtml);

    if (rehydrationScript) {
      // Store captured data in main-process memory so it can be retrieved
      // directly without injecting scripts into the page (which CSP blocks).
      const hash = getStoreHashFromUrl(request.url);
      runtimeDataStore.set(hash, {
        linkedin: { type: SiteProvider.linkedin, comoRehydration: rehydrationScript },
      });

      // Evict oldest entries when the store exceeds the cap.
      if (runtimeDataStore.size > MAX_STORE_SIZE) {
        const oldestKey = runtimeDataStore.keys().next().value;
        if (oldestKey) runtimeDataStore.delete(oldestKey);
      }
    }

    // Return the original response unchanged.
    return new Response(rawHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  });
}

/**
 * Retrieve (and remove) the runtime data captured by the protocol handler
 * for a given URL. Call from the main process — no renderer round-trip needed.
 */
export function consumeRuntimeData(url: string): WebPageRuntimeData {
  const hash = getStoreHashFromUrl(url);
  const data = runtimeDataStore.get(hash);
  if (data) runtimeDataStore.delete(hash);
  return data ?? {};
}

/**
 * Get a store hash from a url.
 */
export function getStoreHashFromUrl(url: string): string {
  let urlToHash = url;
  if (url.includes('linkedin.com/jobs/search-results')) {
    const urlObj = new URL(url);

    // only keep some known query params that affect the page content
    const relevantParams = ['keywords', 'geoId'];
    const filteredParams = new URLSearchParams(
      [...urlObj.searchParams].filter(([key]) => relevantParams.includes(key)),
    );

    urlObj.search = filteredParams.toString();
    urlToHash = urlObj.toString();
  }

  const hash = createHash('sha256').update(urlToHash).digest('hex');
  return hash;
}
