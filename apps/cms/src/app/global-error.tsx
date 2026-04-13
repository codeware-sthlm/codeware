'use client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
};

/**
 * Global error boundary rendered when an unhandled error escapes the root layout.
 *
 * Sentry instrumentation already captures these server-side errors automatically —
 * no need to call `captureException` here, which would double-report.
 *
 * Renders a minimal maintenance page that works without any providers or styles
 * since the root layout itself may have failed.
 */
export default function GlobalError({ error }: GlobalErrorProps) {
  return (
    <html>
      <head>
        <title>Technical difficulties</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f9fafb',
          color: '#111827'
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            We&apos;re having technical difficulties
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            The service is temporarily unavailable. Please try again in a moment.
          </p>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
