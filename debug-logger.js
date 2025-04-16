const fs = require('fs');
const path = require('path');

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

// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Error creating log directory:', err);
}

/**
 * Write log message to a specific file
 * @param {string} file - Log file path
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function logToSpecificFile(file, level, message, data = null) {
  try {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      logMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    logMessage += '\n' + '-'.repeat(80) + '\n';
    
    fs.appendFileSync(file, logMessage);
  } catch (err) {
    console.error('Error writing to log file:', err);
  }
}

/**
 * Write log message to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
function logToFile(level, message, data = null) {
  logToSpecificFile(LOG_FILE, level, message, data);
}

// Logger functions
const logger = {
  debug: (message, data) => logToFile(LOG_LEVELS.DEBUG, message, data),
  info: (message, data) => logToFile(LOG_LEVELS.INFO, message, data),
  warning: (message, data) => logToFile(LOG_LEVELS.WARNING, message, data),
  error: (message, data) => logToFile(LOG_LEVELS.ERROR, message, data)
};

// TCBS API specific logger
const tcbsLogger = {
  debug: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.DEBUG, message, data),
  info: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.INFO, message, data),
  warning: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.WARNING, message, data),
  error: (message, data) => logToSpecificFile(TCBS_LOG_FILE, LOG_LEVELS.ERROR, message, data),
};

module.exports = {
  logger,
  tcbsLogger,
  logToFile,
  logToSpecificFile,
  LOG_LEVELS
}; 