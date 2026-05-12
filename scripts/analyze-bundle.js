#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the built bundle to identify large dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Vite manifest to understand chunk contents
function analyzeBundles() {
  console.log('📊 Bundle Analysis Report\n');
  
  const clientPath = '.svelte-kit/output/client';
  const manifestPath = path.join(clientPath, '.vite/manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Manifest file not found. Run `npm run build` first.');
    process.exit(1);
  }
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Analyze chunks by size
  const chunks = [];
  
  for (const [key, entry] of Object.entries(manifest)) {
    if (entry.file && entry.file.endsWith('.js')) {
      const filePath = path.join(clientPath, entry.file);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        chunks.push({
          name: key,
          file: entry.file,
          size: stats.size,
          imports: entry.imports || [],
          dynamicImports: entry.dynamicImports || []
        });
      }
    }
  }
  
  // Sort by size (descending)
  chunks.sort((a, b) => b.size - a.size);
  
  console.log('🏆 Top 10 Largest Chunks:');
  console.log('━'.repeat(80));
  
  chunks.slice(0, 10).forEach((chunk, index) => {
    const sizeKB = (chunk.size / 1024).toFixed(2);
    console.log(`${index + 1}.`.padStart(3), 
      chunk.file.padEnd(50), 
      `${sizeKB} KB`.padStart(12)
    );
  });
  
  console.log();
  
  // Estimate Chart.js and D3.js presence
  console.log('🔍 Searching for Chart Libraries in Bundles...');
  console.log('━'.repeat(80));
  
  let foundD3 = false;
  let foundChartJS = false;
  
  chunks.forEach(chunk => {
    const filePath = path.join(clientPath, chunk.file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Simple string search for library signatures
    const hasD3 = content.includes('d3-') || content.includes('d3.') || content.includes('d3[');
    const hasChartJS = content.includes('Chart.js') || content.includes('chartjs') || content.includes('Chart.register');
    
    if (hasD3 || hasChartJS) {
      const sizeKB = (chunk.size / 1024).toFixed(2);
      console.log(`📦 ${chunk.file} (${sizeKB} KB)`);
      
      if (hasD3) {
        console.log('   ├─ 🎯 Contains D3.js code');
        foundD3 = true;
      }
      if (hasChartJS) {
        console.log('   └─ 📊 Contains Chart.js code');
        foundChartJS = true;
      }
    }
  });
  
  if (!foundD3 && !foundChartJS) {
    console.log('✅ No chart libraries found in main bundles!');
    console.log('   Chart libraries should be lazy-loaded separately.');
  }
  
  console.log();
  
  // Calculate total bundle size
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log('📈 Bundle Size Summary:');
  console.log('━'.repeat(80));
  console.log(`Total JavaScript: ${totalSizeKB} KB (${totalSizeMB} MB)`);
  console.log(`Number of chunks: ${chunks.length}`);
  
  // Performance recommendations
  console.log();
  console.log('💡 Performance Recommendations:');
  console.log('━'.repeat(80));
  
  if (foundD3 || foundChartJS) {
    console.log('⚠️  Chart libraries detected in main bundle');
    console.log('   → Consider implementing lazy loading for D3.js and Chart.js');
    console.log('   → Potential savings: ~150KB');
  }
  
  if (totalSize > 1024 * 1024) { // > 1MB
    console.log('⚠️  Large bundle size detected');
    console.log('   → Consider code splitting for large dependencies');
    console.log('   → Implement tree shaking for unused code');
  }
  
  if (chunks[0].size > 500 * 1024) { // > 500KB
    console.log('⚠️  Very large chunk detected');
    console.log(`   → ${chunks[0].file} is ${(chunks[0].size / 1024).toFixed(2)} KB`);
    console.log('   → Consider splitting this chunk further');
  }
  
  console.log();
}

// Run the analysis
analyzeBundles();

export { analyzeBundles };