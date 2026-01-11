/**
 * Package Script
 * Creates a .oc-module file from the built module
 *
 * Usage: npm run package
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function packageModule() {
  console.log('Packaging OC module...\n');

  // Read manifest
  const manifestPath = path.join(__dirname, '..', 'oc.module.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('Error: oc.module.json not found');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Module: ${manifest.displayName} v${manifest.version}`);

  // Check dist folder
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('Error: dist folder not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Check for required files
  const remoteEntryPath = path.join(distPath, 'remoteEntry.js');
  if (!fs.existsSync(remoteEntryPath)) {
    console.error('Error: remoteEntry.js not found in dist folder');
    process.exit(1);
  }

  // Create output filename
  const outputFilename = `${manifest.name}-${manifest.version}.oc-module`;
  const outputPath = path.join(__dirname, '..', outputFilename);

  // Create archive
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`\nPackage created: ${outputFilename}`);
    console.log(`Size: ${sizeMB} MB`);
    console.log('\nYou can now upload this file to Offshore Constructor.');
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add manifest
  archive.file(manifestPath, { name: 'oc.module.json' });

  // Add dist folder contents
  archive.directory(distPath, 'dist');

  // Add assets folder if it exists
  const assetsPath = path.join(__dirname, '..', 'assets');
  if (fs.existsSync(assetsPath)) {
    archive.directory(assetsPath, 'assets');
  }

  await archive.finalize();
}

packageModule().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});
