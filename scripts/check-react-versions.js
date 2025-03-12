const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Checking for multiple React installations...');

try {
  // Find all React installations
  const result = execSync('npm ls react', { encoding: 'utf8' });
  console.log(result);
  
  // Find react-dom as well
  const resultDom = execSync('npm ls react-dom', { encoding: 'utf8' });
  console.log(resultDom);
  
  if (result.includes('deduped') || resultDom.includes('deduped')) {
    console.log('\nWARNING: Multiple React versions detected. This can cause "Invalid Hook Call" errors.');
    console.log('Consider running: npm dedupe\n');
  }
} catch (error) {
  console.log('Error checking React versions:', error.message);
}
