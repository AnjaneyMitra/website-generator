const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Cleaning up Next.js build...');

try {
  const nextDir = path.join(process.cwd(), '.next');
  const cacheDir = path.join(process.cwd(), 'node_modules/.cache');

  // Remove .next directory
  if (fs.existsSync(nextDir)) {
    execSync(`rm -rf ${nextDir}`);
    console.log('Removed .next directory');
  }

  // Clear cache
  if (fs.existsSync(cacheDir)) {
    execSync(`rm -rf ${cacheDir}`);
    console.log('Cleared build cache');
  }

  // Run clean install and build
  console.log('Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });
  
  console.log('Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('Build cleanup and rebuild completed successfully');
} catch (error) {
  console.error('Error during cleanup:', error.message);
  process.exit(1);
}
