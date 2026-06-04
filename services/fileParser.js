const mammoth = require('mammoth');
const path = require('path');

async function parseFile(buffer, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.docx' || ext === '.doc') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    } catch (err) {
      console.error('DOCX parse error:', err.message);
      return '';
    }
  }

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text.trim();
    } catch (err) {
      console.error('PDF parse error:', err.message);
      return '';
    }
  }

  if (ext === '.txt') {
    return buffer.toString('utf8');
  }

  return `[קובץ: ${originalName}]`;
}

module.exports = { parseFile };
