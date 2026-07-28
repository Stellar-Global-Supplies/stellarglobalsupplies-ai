import { Router } from "express";
import multer from "multer";
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

router.post("/parse", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });

  const { originalname, buffer, mimetype } = req.file;
  const ext = originalname.split(".").pop().toLowerCase();

  try {
    let text = "";
    let preview = null;

    if (ext === "csv" || mimetype === "text/csv") {
      const records = csvParse(buffer, { columns: true, skip_empty_lines: true });
      const sample = records.slice(0, 5);
      text = `CSV file: ${records.length} rows, columns: ${Object.keys(records[0] || {}).join(", ")}\n\nSample data:\n${JSON.stringify(sample, null, 2)}`;
      preview = { type: "table", columns: Object.keys(records[0] || {}), rows: sample };
    } else if (["xlsx", "xls"].includes(ext)) {
      const wb = XLSX.read(buffer, { type: "buffer" });
      const parts = [];
      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        parts.push(`Sheet "${sheetName}" (${data.length} rows):\n${JSON.stringify(data.slice(0, 5), null, 2)}`);
      }
      text = parts.join("\n\n---\n\n");
      preview = { type: "sheets", sheets: wb.SheetNames };
    } else if (["docx", "doc"].includes(ext)) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value.slice(0, 8000);
      preview = { type: "doc", length: result.value.length };
    } else if (ext === "txt" || mimetype.startsWith("text/")) {
      text = buffer.toString("utf-8").slice(0, 8000);
      preview = { type: "text" };
    } else if (ext === "pdf") {
      text = "[PDF detected — please use a PDF with embedded text. Binary PDFs require additional processing.]";
      preview = { type: "pdf" };
    } else {
      return res.status(415).json({ error: "Unsupported file type" });
    }

    res.json({ text, preview, filename: originalname, size: buffer.length });
  } catch (err) {
    console.error("File parse error:", err);
    res.status(500).json({ error: "Failed to parse file: " + err.message });
  }
});

export default router;
