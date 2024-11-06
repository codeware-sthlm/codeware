import chalk from 'chalk';

/**
 * Check if debug logging is enabled.
 *
 * Either via `CDWR_DEBUG_LOGGING` or `NX_VERBOSE_LOGGING` environment variables.
 *
 * @returns `true` if debug logging is enabled, `false` otherwise.
 */
export function isDebugEnabled(): boolean {
  return (
    process.env['CDWR_DEBUG_LOGGING'] === 'true' ||
    process.env['NX_VERBOSE_LOGGING'] === 'true'
  );
}

/**
 * Log a colored debug message to the console when `CDWR_DEBUG_LOGGING` or `NX_VERBOSE_LOGGING` is set to `true`.
 *
 * Log prefix can be customized by setting the `CDWR_LOG_PREFIX` environment variable.
 * Default log prefix is `E2E`.
 *
 * @param title Log message title
 * @param body Log message body
 */
export function logDebug(title: string, body?: string): void {
  if (!isDebugEnabled()) {
    return;
  }

  const message = `${chalk.reset.inverse.bold.cyan(
    ' DEBUG '
  )} ${chalk.bold.cyan(title)}`;
  return consoleLogger(message, body);
}

/**
 * Log a colored info message to the console.
 *
 * Log prefix can be customized by setting the `CDWR_LOG_PREFIX` environment variable.
 * Default log prefix is `E2E`.
 *
 * @param title Log message title
 * @param body Log message body
 */
export function logInfo(title: string, body?: string): void {
  const message = `${chalk.reset.inverse.bold.blue(
    ' INFO '
  )} ${chalk.bold.blue(title)}`;
  return consoleLogger(message, body);
}

/**
 * Log a colored error message to the console.
 *
 * Log prefix can be customized by setting the `CDWR_LOG_PREFIX` environment variable.
 * Default log prefix is `E2E`.
 *
 * @param title Log message title
 * @param body Log message body
 */
export function logError(title: string, body?: string): void {
  const message = `${chalk.reset.inverse.bold.red(' ERROR ')} ${chalk.bold.red(
    title
  )}`;
  return consoleLogger(message, body);
}

/**
 * Log a colored success message to the console.
 *
 * Log prefix can be customized by setting the `CDWR_LOG_PREFIX` environment variable.
 * Default log prefix is `E2E`.
 *
 * @param title Log message title
 * @param body Log message body
 */
export function logSuccess(title: string, body?: string): void {
  const message = `${chalk.reset.inverse.bold.green(
    ' SUCCESS '
  )} ${chalk.bold.green(title)}`;
  return consoleLogger(message, body);
}

/**
 * Log a colored warning message to the console.
 *
 * Log prefix can be customized by setting the `CDWR_LOG_PREFIX` environment variable.
 * Default log prefix is `E2E`.
 *
 * @param title Log message title
 * @param body Log message body
 */
export function logWarning(title: string, body?: string): void {
  const message = `${chalk.reset.inverse.bold.yellow(
    ' WARNING '
  )} ${chalk.bold.yellow(title)}`;
  return consoleLogger(message, body);
}

/** @private */
function consoleLogger(message: string, body?: string): void {
  process.stdout.write('\n');
  process.stdout.write(`${getLogPrefix()} ${message}\n`);
  if (body) {
    process.stdout.write(`${body}\n`);
  }
  process.stdout.write('\n');
}

/** @private */
function getLogPrefix(): string {
  const prefix = process.env['CDWR_LOG_PREFIX'] ?? 'E2E';
  return `${chalk.reset.inverse.bold.yellow(` ${prefix.trim()} `)}`;
}
