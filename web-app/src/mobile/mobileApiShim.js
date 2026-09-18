/**
 * Mobile-only fetch shim. Prepends API origin to relative /api paths and routes
 * native Capacitor requests through CapacitorHttp so CORS / WebView fetch quirks
 * do not break POST endpoints like punch-in / punch-out.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const DEFAULT_PRODUCTION_API = 'https://test.solviotec.com';

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN ||
  (Capacitor.isNativePlatform() ? DEFAULT_PRODUCTION_API : '')
).replace(/\/$/, '');

function resolveUrl(input) {
  if (!API_ORIGIN) return typeof input === 'string' ? input : String(input?.url || input);
  const url =
    typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : String(input);
  if (url.startsWith('/api/') || url.startsWith('/select_role') || url.startsWith('/static/')) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
}

function headersToObject(headers) {
  const out = {};
  if (!headers) return out;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[key] = value;
    return out;
  }
  return { ...headers };
}

function buildFetchResponse(httpResponse) {
  const status = Number(httpResponse?.status || 0);
  const headerBag = httpResponse?.headers || {};
  const headers = new Headers();
  Object.entries(headerBag).forEach(([key, value]) => {
    if (value != null) headers.set(key, String(value));
  });

  let bodyText = '';
  const data = httpResponse?.data;
  if (typeof data === 'string') {
    bodyText = data;
  } else if (data == null) {
    bodyText = '';
  } else {
    try {
      bodyText = JSON.stringify(data);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    } catch {
      bodyText = String(data);
    }
  }

  return new Response(bodyText, {
    status: status || 200,
    statusText: status >= 400 ? 'Error' : 'OK',
    headers,
  });
}

async function readRequestBody(input, init) {
  if (init?.body != null) return init.body;
  if (input instanceof Request) {
    try {
      return await input.clone().text();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function nativeApiFetch(url, input, init = {}) {
  const method = (
    init.method ||
    (input instanceof Request ? input.method : 'GET') ||
    'GET'
  ).toUpperCase();

  const headers = {
    ...headersToObject(input instanceof Request ? input.headers : null),
    ...headersToObject(init.headers),
  };

  const bodyRaw = await readRequestBody(input, init);
  let data = bodyRaw;
  const contentType = String(headers['Content-Type'] || headers['content-type'] || '').toLowerCase();

  // CapacitorHttp prefers a JS object for JSON POSTs (avoids double-encoding).
  if (
    typeof bodyRaw === 'string' &&
    contentType.includes('application/json')
  ) {
    try {
      data = JSON.parse(bodyRaw);
    } catch {
      data = bodyRaw;
    }
  }

  const options = {
    url,
    method,
    headers,
    connectTimeout: 30000,
    readTimeout: 30000,
  };
  if (data !== undefined && method !== 'GET' && method !== 'HEAD') {
    options.data = data;
  }

  const httpResponse = await CapacitorHttp.request(options);
  return buildFetchResponse(httpResponse);
}

export function installMobileApiShim() {
  if (!API_ORIGIN) return;

  const browserFetch = window.fetch.bind(window);
  const useNativeHttp = Capacitor.isNativePlatform();

  window.fetch = async (input, init) => {
    const resolved = resolveUrl(input);
    const originalUrl =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    const rewritten = resolved !== originalUrl && String(resolved).startsWith(API_ORIGIN);

    if (useNativeHttp && (rewritten || String(resolved).startsWith(API_ORIGIN))) {
      const method = (
        init?.method ||
        (input instanceof Request ? input.method : 'GET') ||
        'GET'
      ).toUpperCase();
      // Native HTTP avoids WebView CORS/fetch bugs on JSON mutations (punch-in/out).
      // Keep GET/HEAD on rewritten fetch so blob/file downloads still work.
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          return await nativeApiFetch(String(resolved), input, init || {});
        } catch (err) {
          console.warn('CapacitorHttp request failed, falling back to fetch:', err);
        }
      }
    }

    if (resolved === originalUrl || resolved === input) {
      return browserFetch(input, init);
    }

    if (input instanceof Request) {
      return browserFetch(
        new Request(resolved, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          mode: 'cors',
          credentials: input.credentials,
          cache: input.cache,
          redirect: input.redirect,
          referrer: input.referrer,
          integrity: input.integrity,
        }),
        init
      );
    }

    return browserFetch(resolved, {
      ...init,
      mode: init?.mode ?? 'cors',
    });
  };
}

export function getApiOrigin() {
  return API_ORIGIN;
}
