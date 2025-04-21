import fs from 'fs';
import path from 'path';

// Define log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
};

// Logger configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'api-calls.log');
const TCBS_LOG_FILE = path.join(LOG_DIR, 'tcbs-api.log');

// Check if running on Vercel or other serverless environments
// Vercel sets this environment variable
const isVercel = process.env.VERCEL === '1';
// Check for other serverless environments that might have read-only file systems
const isServerless = isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

// Only create log directory if we're not in a serverless environment
if (!isServerless) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating log directory:', err);
  }
}

/**
 * Write log message to stdout/stderr or a specific file
 * @param {string} file - Log file path (used in non-serverless environments)
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @param {boolean} isTCBS - Whether this is a TCBS log entry
 */
export function logToSpecificFile(file, level, message, data = null, isTCBS = false) {
  const timestamp = new Date().toISOString();
  let logType = isTCBS ? 'TCBS' : 'API';
  let logMessage = `[${timestamp}] [${level}] [${logType}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      logMessage += `\n${JSON.stringify(data, null, 2)}`;
    } else {
      logMessage += `\n${data}`;
    }
  }
  
  // In serverless environments, write to stdout/stderr
  if (isServerless) {
    if (level === LOG_LEVELS.ERROR) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
    return;
  }
  
  // Regular file-based logging for non-serverless environments
  try {
    logMessage += '\n' + '-'.repeat(80) + '\n';
    
    fs.appendFileSync(file, logMessage);
  } catch (err) {
    console.error('Error writing to log file:', err);
    // Fallback to console if file write fails
    if (level === LOG_LEVELS.ERROR) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  }
}

/**
 * Write log message to file or stdout/stderr
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
export function logToFile(level, message, data = null) {
  logToSpecificFile(LOG_FILE, level, message, data, false);
}

// Logger functions
export const serverLogger = {
  debug: (message, data) => logToFile(LOG_LEVELS.DEBUG, message, data),
  info: (message, data) => logToFile(LOG_LEVELS.INFO, message, data),
  warning: (message, data) => logToFile(LOG_LEVELS.WARNING, message, data),
  error: (message, data) => logToFile(LOG_LEVELS.ERROR, message, data)
};

// TCBS API specific logger
export const tcbsServerLogger = {
  debug: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.DEBUG, message, data, true),
  info: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.INFO, message, data, true),
  warning: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.WARNING, message, data, true),
  error: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.ERROR, message, data, true),
};

export default serverLogger; 