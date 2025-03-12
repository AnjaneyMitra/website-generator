const fs = require('fs');
const path = require('path');

// Check if there are multiple versions of React in the node_modules
function checkForReactDuplicates() {
  console.log('Checking for duplicate React installations...');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  let reactInstallations = [];

  function searchForReact(dirPath, depth = 0) {
    if (depth > 3) return; // Limit search depth
    
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        if (file === 'react' && fs.existsSync(path.join(fullPath, 'package.json'))) {
          const packageJson = require(path.join(fullPath, 'package.json'));
          reactInstallations.push({
            path: fullPath,
            version: packageJson.version
          });
        } else {
          searchForReact(fullPath, depth + 1);
        }
      }
    }
  }

  searchForReact(nodeModulesPath);
  
  if (reactInstallations.length > 1) {
    console.log('⚠️ Multiple React installations detected:');
    reactInstallations.forEach(installation => {
      console.log(`- ${installation.path} (${installation.version})`);
    });
    console.log('\nThis may cause "Invalid Hook Call" errors.');
    console.log('Try running "npm dedupe" or check your package-lock.json for duplicate dependencies.');
  } else if (reactInstallations.length === 1) {
    console.log('✓ Single React installation found:', reactInstallations[0].path, reactInstallations[0].version);
  } else {
    console.log('❌ No React installation found in node_modules.');
  }
}

checkForReactDuplicates();
