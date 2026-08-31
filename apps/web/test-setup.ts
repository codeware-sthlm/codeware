import { installGlobals } from '@remix-run/node';
import '@testing-library/jest-dom/matchers';
installGlobals();

// `installGlobals()` swaps in Remix's Response polyfill, which carries no
// static `json()`. Node 22 has it and that is what the server runs on, so
// without this the test environment is less capable than production and
// routes using `Response.json` cannot be tested at all.
if (typeof Response.json !== 'function') {
  (
    Response as unknown as {
      json: (body: unknown, init?: ResponseInit) => Response;
    }
  ).json = (body, init) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers }
    });
}
