// Load environment variables from .env file
import { config } from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
const result = config({ path: resolve(__dirname, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

console.log('Environment variables loaded successfully');
console.log('Starting development server...');

// Start the development server
const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`Development server exited with code ${code}`);
    process.exit(code);
  }
});
