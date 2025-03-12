const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Running fix for React hooks issues...');

try {
  // Remove node_modules and package-lock.json to ensure clean install
  console.log('Cleaning up node_modules and package-lock.json...');
  
  if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    execSync('rm -rf node_modules');
  }
  
  if (fs.existsSync(path.join(process.cwd(), 'package-lock.json'))) {
    execSync('rm -f package-lock.json');
  }
  
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Run deduplication
  console.log('Running deduplication...');
  execSync('npm dedupe', { stdio: 'inherit' });
  
  console.log('Completed React hooks fix process.');
  console.log('Next steps:');
  console.log('1. Run your application');
  console.log('2. If the issue persists, check individual components for hooks usage rules violations');
} catch (error) {
  console.error('Error during fix process:', error.message);
}
