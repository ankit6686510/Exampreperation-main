const fs = require('fs');
const path = require('path');

const logger = require('../config/logger');

// Map of console methods to logger methods
const consoleToLoggerMap = {
  'console.error': 'logger.error',
  'console.warn': 'logger.warn',
  'console.info': 'logger.info',
  'console.log': 'logger.info',
  'console.debug': 'logger.debug'
};

// Controllers that need logger import
const controllersDir = path.join(__dirname, '..', 'controllers');

function addLoggerImport(content) {
  // Check if logger is already imported
  if (content.includes("require('../config/logger')") || content.includes('const logger')) {
    return content;
  }

  // Find the last require statement
  const requireRegex = /const .+ = require\([^)]+\);/g;
  const matches = content.match(requireRegex);
  
  if (matches && matches.length > 0) {
    const lastRequire = matches[matches.length - 1];
    const lastRequireIndex = content.lastIndexOf(lastRequire);
    const insertPosition = lastRequireIndex + lastRequire.length;
    
    return content.slice(0, insertPosition) + 
           "\nconst logger = require('../config/logger');" + 
           content.slice(insertPosition);
  }
  
  // If no requires found, add at the beginning
  return "const logger = require('../config/logger');\n\n" + content;
}

function replaceConsoleLogs(content, filename) {
  let modified = content;
  let changesMade = false;

  // Replace console.error with structured logging
  const errorPattern = /console\.error\('([^']+)',\s*error\);/g;
  modified = modified.replace(errorPattern, (match, message) => {
    changesMade = true;
    const context = message.replace(' error:', '').trim();
    return `logger.error('${message}', { error: error.message, stack: error.stack, context: '${context}' });`;
  });

  // Replace simple console.error
  const simpleErrorPattern = /console\.error\(([^)]+)\);/g;
  modified = modified.replace(simpleErrorPattern, (match, args) => {
    changesMade = true;
    return `logger.error(${args});`;
  });

  // Replace console.log
  const logPattern = /console\.log\(([^)]+)\);/g;
  modified = modified.replace(logPattern, (match, args) => {
    changesMade = true;
    return `logger.info(${args});`;
  });

  // Replace console.warn
  const warnPattern = /console\.warn\(([^)]+)\);/g;
  modified = modified.replace(warnPattern, (match, args) => {
    changesMade = true;
    return `logger.warn(${args});`;
  });

  if (changesMade) {
    modified = addLoggerImport(modified);
  }

  return { content: modified, changed: changesMade };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  const { content: newContent, changed } = replaceConsoleLogs(content, filename);
  
  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Updated: ${filename}`);
    return true;
  }
  
  return false;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalUpdated = 0;

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalUpdated += processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      if (processFile(filePath)) {
        totalUpdated++;
      }
    }
  });

  return totalUpdated;
}

// Main execution
console.log('🔄 Replacing console.* calls with logger...\n');

const controllersUpdated = processDirectory(controllersDir);

console.log(`\n✨ Complete! Updated ${controllersUpdated} controller files.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes');
console.log('2. Test the application');
console.log('3. Commit the changes');