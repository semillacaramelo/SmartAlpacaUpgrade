#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Files and directories to include
const INCLUDE_PATTERNS = [
  // Source files
  'client/src/**/*.{ts,tsx,js,jsx,css,json}',
  'server/**/*.{ts,js,json}',
  'shared/**/*.{ts,js,json}',
  'scripts/**/*.{js,ts,json}',

  // Configuration files
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'drizzle.config.ts',
  'components.json',

  // Documentation
  'README.md',
  'docs/**/*.md',

  // VS Code configuration
  '.vscode/**/*.{json,md}',

  // Git configuration
  '.gitignore',

  // Environment template (without actual values)
  '.env.example'
];

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  '*.log',
  '.DS_Store',
  'coverage',
  '.env', // Exclude actual environment file
  'build',
  'public',
  '*.min.js',
  '*.min.css'
];

function shouldIncludeFile(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  // Check exclude patterns
  for (const exclude of EXCLUDE_PATTERNS) {
    if (relativePath.includes(exclude) || relativePath.startsWith(exclude)) {
      return false;
    }
  }

  // Simple include check - include common source file extensions
  const ext = path.extname(filePath).toLowerCase();
  const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md'];

  if (sourceExtensions.includes(ext)) {
    // Exclude files in node_modules, dist, etc.
    return !relativePath.includes('node_modules') &&
           !relativePath.includes('dist') &&
           !relativePath.includes('.git') &&
           !relativePath.startsWith('.env') &&
           relativePath !== 'package-lock.json'; // Too large
  }

  // Include specific configuration files
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'drizzle.config.ts',
    'components.json',
    '.gitignore'
  ];

  return configFiles.includes(path.basename(filePath));
}

function getAllSourceFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      if (!EXCLUDE_PATTERNS.some(exclude => item.includes(exclude) || item === exclude)) {
        getAllSourceFiles(fullPath, files);
      }
    } else if (stat.isFile()) {
      if (shouldIncludeFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function createEnvExample() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    // Replace actual values with placeholders
    const exampleContent = envContent
      .replace(/=.*/g, '=your_value_here')
      .replace(/your_value_here/g, (match, offset, string) => {
        if (string.includes('DATABASE_URL')) return 'postgresql://user:password@localhost:5432/smart_alpaca';
        if (string.includes('ALPACA_API_KEY')) return 'your_alpaca_api_key';
        if (string.includes('ALPACA_SECRET_KEY')) return 'your_alpaca_secret_key';
        if (string.includes('GEMINI_API_KEY')) return 'your_gemini_api_key';
        return 'your_value_here';
      });

    fs.writeFileSync(envExamplePath, exampleContent);
  }
}

function generateProjectSnapshot() {
  console.log('🔍 Scanning project files...');

  const sourceFiles = getAllSourceFiles(PROJECT_ROOT);
  console.log(`📁 Found ${sourceFiles.length} source files`);

  // Create .env.example if it doesn't exist
  createEnvExample();

  // Get package.json for project info
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));

  // Generate timestamp
  const timestamp = new Date().toISOString();

  // Create output file
  const outputFile = path.join(PROJECT_ROOT, 'smart-alpaca-upgrade-sources.txt');
  let output = '';

  // Add header with project information
  output += '='.repeat(80) + '\n';
  output += 'SMART ALPACA UPGRADE - COMPLETE SOURCE CODE\n';
  output += '='.repeat(80) + '\n\n';

  output += 'PROJECT INFORMATION:\n';
  output += '-'.repeat(20) + '\n';
  output += `Name: ${packageJson.name}\n`;
  output += `Version: ${packageJson.version}\n`;
  output += `Description: ${packageJson.description || 'AI-powered algorithmic trading platform'}\n`;
  output += `Generated: ${timestamp}\n`;
  output += `Total Files: ${sourceFiles.length}\n\n`;

  output += 'REBUILD INSTRUCTIONS:\n';
  output += '-'.repeat(20) + '\n';
  output += '1. Create a new directory for the project\n';
  output += '2. Copy the contents of this file to individual files\n';
  output += '3. Run: npm install\n';
  output += '4. Set up PostgreSQL database (see README.md)\n';
  output += '5. Copy .env.example to .env and fill in your API keys\n';
  output += '6. Run: npm run db:push\n';
  output += '7. Run: npm run dev\n\n';

  output += 'REQUIRED DEPENDENCIES:\n';
  output += '-'.repeat(20) + '\n';
  output += '- Node.js 18+\n';
  output += '- PostgreSQL 16+\n';
  output += '- Git\n\n';

  output += 'API KEYS REQUIRED:\n';
  output += '-'.repeat(18) + '\n';
  output += '- Alpaca Trading API Key & Secret\n';
  output += '- Google Gemini AI API Key\n\n';

  // Sort files by path for consistent ordering
  sourceFiles.sort();

  // Add each file with header
  for (const filePath of sourceFiles) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileExtension = path.extname(filePath).toLowerCase();

    output += '='.repeat(80) + '\n';
    output += `FILE: ${relativePath}\n`;
    output += '='.repeat(80) + '\n\n';

    // Add file type information
    if (['.ts', '.tsx', '.js', '.jsx'].includes(fileExtension)) {
      output += `// Language: ${fileExtension === '.ts' ? 'TypeScript' : fileExtension === '.tsx' ? 'TypeScript React' : fileExtension === '.js' ? 'JavaScript' : 'JavaScript React'}\n`;
    } else if (fileExtension === '.json') {
      output += '// Language: JSON\n';
    } else if (fileExtension === '.css') {
      output += '/* Language: CSS */\n';
    } else if (fileExtension === '.md') {
      output += '<!-- Language: Markdown -->\n';
    }

    output += '\n';
    output += fileContent;
    output += '\n\n';
  }

  // Write to output file
  fs.writeFileSync(outputFile, output, 'utf8');

  console.log(`✅ Source code merged successfully!`);
  console.log(`📄 Output file: ${outputFile}`);
  console.log(`📊 Total files processed: ${sourceFiles.length}`);
  console.log(`📏 File size: ${(output.length / 1024 / 1024).toFixed(2)} MB`);

  return outputFile;
}

// Run the script
try {
  const outputFile = generateProjectSnapshot();
  console.log('\n🎉 Project snapshot created successfully!');
  console.log(`📂 File location: ${outputFile}`);
} catch (error) {
  console.error('❌ Error creating project snapshot:', error);
  process.exit(1);
}
