const fs = require('fs');
const path = require('path');

function fixTypeErrors(content) {
  let modified = content;
  let changesMade = false;

  // Replace error: any with proper ApiError type
  const errorAnyPattern = /catch \(error: any\) \{[\s\S]*?return rejectWithValue\(error\.response\?\.\data\?\.\message \|\| '([^']+)'\);/g;
  
  modified = modified.replace(errorAnyPattern, (match, errorMessage) => {
    changesMade = true;
    return match.replace('error: any', 'error').replace(
      `return rejectWithValue(error.response?.data?.message || '${errorMessage}');`,
      `const apiError = error as ApiError;\n      return rejectWithValue(apiError.message || '${errorMessage}');`
    );
  });

  // Add ApiError import if changes were made and import doesn't exist
  if (changesMade && !modified.includes("import type { ApiError }")) {
    // Find the last import statement
    const importRegex = /import .+ from ['"][^'"]+['"];/g;
    const imports = modified.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = modified.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      modified = modified.slice(0, insertPosition) + 
                "\nimport type { ApiError } from '@/types/api';" + 
                modified.slice(insertPosition);
    }
  }

  return { content: modified, changed: changesMade };
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath);
  const { content: newContent, changed } = fixTypeErrors(content);
  
  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed: ${filename}`);
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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (processFile(filePath)) {
        totalUpdated++;
      }
    }
  });

  return totalUpdated;
}

// Main execution
console.log('🔄 Fixing type safety issues...\n');

const slicesDir = path.join(__dirname, '..', 'client', 'src', 'redux', 'slices');
const slicesUpdated = processDirectory(slicesDir);

console.log(`\n✨ Complete! Fixed ${slicesUpdated} files.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes');
console.log('2. Run TypeScript compiler to verify');
console.log('3. Test the application');