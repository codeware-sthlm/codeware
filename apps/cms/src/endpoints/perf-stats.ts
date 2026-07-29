import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { isUser } from '@codeware/app-cms/util/misc';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { type Endpoint, type PayloadRequest, headersWithCors } from 'payload';

import {
  readQueryStats,
  resetQueryStats,
  setCollecting
} from '../perf/query-stats';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"]/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char
  );

/** Scannable view for the common case: opening this straight from the URL bar */
function renderHtml(stats: ReturnType<typeof readQueryStats>): string {
  const rows = stats.shapes
    .map(
      ({ count, shape }) => `<tr>
        <td class="n">${count}</td>
        <td><code>${escapeHtml(shape)}</code></td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<meta charset="utf-8">
<title>Query profiler</title>
<style>
  body { font: 14px/1.5 ui-monospace, monospace; margin: 2rem; }
  h1 { font-size: 1.1rem; }
  .bar { display: flex; gap: .5rem; margin: 1rem 0; }
  .bar a { padding: .3rem .7rem; border: 1px solid currentColor; border-radius: 4px; text-decoration: none; color: inherit; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  td, th { border-bottom: 1px solid rgba(128,128,128,.3); padding: .4rem .6rem; text-align: left; vertical-align: top; }
  .n { text-align: right; font-weight: 700; white-space: nowrap; }
  code { white-space: pre-wrap; word-break: break-all; }
  .idle { opacity: .6; }
</style>
<h1>Query profiler — ${stats.collecting ? 'collecting' : '<span class="idle">idle</span>'}</h1>
<p>${stats.total} queries · ${stats.distinctShapes} distinct shapes · ${Math.round(stats.windowMs / 1000)}s window</p>
<div class="bar">
  <a href="?start">Start</a>
  <a href="?stop">Stop</a>
  <a href="?reset">Reset</a>
  <a href="?">Refresh</a>
</div>
<table><tr><th class="n">count</th><th>query shape</th></tr>${rows}</table>`;
}

/**
 * Database query profiler, development only.
 *
 * Open it in the browser, hit Start, exercise the admin UI, then Refresh —
 * queries are grouped by shape so repeated identical ones stand out.
 */
export const perfStatsEndpoint: Endpoint = {
  path: '/perf-stats',
  method: 'get',
  handler: async (req: PayloadRequest): Promise<Response> => {
    const headers = headersWithCors({ headers: new Headers(), req });

    const fail = (status: number) =>
      Response.json({ error: getReasonPhrase(status) }, { status, headers });

    // Never expose profiling outside local development
    if (getEnv().DEPLOY_ENV !== 'development') {
      return fail(StatusCodes.NOT_FOUND);
    }

    // Admin-session users only; API key clients have no business reading this
    if (!isUser(req.user)) {
      return fail(StatusCodes.FORBIDDEN);
    }

    if (req.searchParams.has('start')) {
      setCollecting(true);
    } else if (req.searchParams.has('stop')) {
      setCollecting(false);
    } else if (req.searchParams.has('reset')) {
      resetQueryStats();
    }

    const stats = readQueryStats(
      Number(req.searchParams.get('limit')) || undefined
    );

    // Browsers navigating here get the table; curl and fetch get JSON
    if (req.headers.get('accept')?.includes('text/html')) {
      headers.set('content-type', 'text/html; charset=utf-8');
      return new Response(renderHtml(stats), {
        status: StatusCodes.OK,
        headers
      });
    }

    return Response.json(stats, { status: StatusCodes.OK, headers });
  }
};
