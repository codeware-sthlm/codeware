/**
 * Outputs to console when `ENV_DEBUG=true`
 */
const debugLog = (message: string, ...args: Array<unknown>) => {
  if (process.env.ENV_DEBUG === 'true') {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

export default debugLog;
