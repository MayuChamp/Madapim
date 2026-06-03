const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.docx' || ext === '.doc') {
    return parseDocx(filePath);
  }
  if (ext === '.pdf') {
    return parsePdf(filePath);
  }
  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }
  // Unknown type — return filename as placeholder
  return `[קובץ: ${originalName}]`;
}

async function parseDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  } catch (err) {
    console.error('DOCX parse error:', err.message);
    return '';
  }
}

async function parsePdf(filePath) {
  try {
    // Lazy-require so startup doesn't fail if pdf-parse isn't installed yet
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (err) {
    console.error('PDF parse error:', err.message);
    return '';
  }
}

module.exports = { parseFile };
