import { parse as parseCsv } from 'csv-parse';
import XLSX from 'xlsx';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function parseFile(buffer, mimetype, originalname) {
  const ext = (originalname || '').split('.').pop()?.toLowerCase();
  try {
    if (mimetype === 'text/csv' || ext === 'csv') {
      return await parseCsvToText(buffer);
    }
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || ext === 'xlsx' || ext === 'xls') {
      return parseXlsx(buffer);
    }
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    if (mimetype === 'application/pdf' || ext === 'pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    }
    if (mimetype === 'text/plain' || ext === 'txt' || ext === 'md') {
      return buffer.toString('utf-8');
    }
    return buffer.toString('utf-8');
  } catch (err) {
    return `[Failed to parse ${originalname}: ${err.message}]`;
  }
}

function parseCsvToText(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    parseCsv(buffer, { skip_empty_lines: true })
      .on('data', (row) => rows.push(row))
      .on('end', () => {
        const text = rows.map((r) => r.join(' | ')).join('\n');
        resolve(text);
      })
      .on('error', reject);
  });
}

function parseXlsx(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheets = wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_csv(sheet);
    return `### Sheet: ${name}\n${rows}`;
  });
  return sheets.join('\n\n');
}
