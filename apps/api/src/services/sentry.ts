import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(): void {
  if (initialized) {
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
  });
  initialized = true;
}

/**
 * Azure Functions instances can freeze immediately after a response is
 * returned, so queued Sentry events must be flushed explicitly before the
 * handler resolves rather than relying on Sentry's background flush timer.
 */
export async function captureAndFlush(error: unknown): Promise<void> {
  Sentry.captureException(error);
  await Sentry.flush(2000);
}
