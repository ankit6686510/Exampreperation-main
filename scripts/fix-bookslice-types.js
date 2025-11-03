const fs = require('fs');
const path = require('path');

const bookSlicePath = path.join(__dirname, '..', 'client', 'src', 'redux', 'slices', 'bookSlice.ts');

let content = fs.readFileSync(bookSlicePath, 'utf8');

// Fix the malformed error handling
content = content.replace(
  /return rejectWithValue\(const apiError = error as ApiError;\s+return rejectWithValue\(apiError\.message \|\| '([^']+)'\);/g,
  "const apiError = error as ApiError;\n      return rejectWithValue(apiError.message || '$1');"
);

// Fix remaining error: any patterns
content = content.replace(
  /} catch \(error: any\) \{\s+return rejectWithValue\(error\.response\?\.\data\?\.\message \|\| '([^']+)'\);/g,
  "} catch (error) {\n      const apiError = error as ApiError;\n      return rejectWithValue(apiError.message || '$1');"
);

fs.writeFileSync(bookSlicePath, content, 'utf8');
console.log('✅ Fixed bookSlice.ts type errors');