import { readdir, stat, mkdir, access } from 'fs/promises';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function selectFiles(currentDir, excludePatterns) {
  const selectedFiles = [];

  const files = await readdir(currentDir);
  for (const file of files) {
    // Skip files/directories that match exclude patterns
    if (excludePatterns.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(file);
      }
      return file === pattern || file.startsWith(pattern);
    })) {
      continue;
    }

    const filePath = join(currentDir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const subFiles = await selectFiles(filePath, excludePatterns);
      selectedFiles.push(...subFiles);
    } else {
      selectedFiles.push(filePath);
    }
  }

  return selectedFiles;
}

async function mergeFiles(selectedFiles, outputFilePath) {
  let mergedContent = '';

  for (const filePath of selectedFiles) {
    const fileContent = await readFile(filePath, 'utf-8');
    const sectionHeader = `\n${filePath.toUpperCase()} CODE IS BELOW\n`;
    mergedContent += sectionHeader + fileContent + '\n';
  }

  await writeFile(outputFilePath, mergedContent);
}

async function createOutputDirectory(outputDirPath) {
  try {
    await access(outputDirPath);
  } catch (error) {
    await mkdir(outputDirPath);
  }
}

function getTimestampedFileName() {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  return `merged-repo-${timestamp}.txt`;
}

async function main() {
  try {
    const currentDir = process.cwd();

    console.log('Automatically selecting and merging files...');
    const excludePatterns = [
      'node_modules',
      '.git',
      '.env',
      '.DS_Store',
      'dist',
      'build',
      'coverage',
      /^\./,  // Hidden files
      /\.log$/,
      /\.map$/,
      'llm_text_transcripts',
      /\.(jpg|jpeg|png|gif|ico|svg|mp4|mov|avi|mp3|wav|pdf)$/i
    ];
    
    const selectedFiles = await selectFiles(currentDir, excludePatterns);
    console.log(`Found ${selectedFiles.length} files to merge.`);

    const outputDirName = 'llm_text_transcripts';
    const outputDirPath = join(currentDir, outputDirName);
    await createOutputDirectory(outputDirPath);

    const outputFileName = getTimestampedFileName();
    const outputFilePath = join(outputDirPath, outputFileName);
    await mergeFiles(selectedFiles, outputFilePath);

    console.log(`Merged repository saved to: ${outputFilePath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();