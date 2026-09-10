import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config } from "./config.js";

const invalid = message => Object.assign(new Error(message), { status: 400 });
const allowed = new Set(["code", "slug", "title", "summary", "description", "category", "difficulty", "duration", "modules", "price", "currency", "instructor", "learningOutcomes", "curriculum", "details", "format", "imageUrl", "certificateSampleUrl", "brochureUrl", "featured", "status", "sortOrder", "seo"]);

export function coursePayload(req) {
  let source = req.body;
  if (req.is("multipart/form-data")) {
    try { source = JSON.parse(req.body.payload); }
    catch { throw invalid("Invalid course data"); }
  }
  if (!source || typeof source !== "object" || Array.isArray(source)) throw invalid("Invalid course data");
  const data = Object.fromEntries(Object.entries(source).filter(([key]) => allowed.has(key)));
  for (const field of ["curriculum", "learningOutcomes"]) {
    if (data[field] === undefined) continue;
    if (!Array.isArray(data[field]) || data[field].length > 100) throw invalid(`${field} must have at most 100 entries`);
    data[field] = data[field].map(item => {
      if (!item || typeof item !== "object" || (item.ar !== undefined && typeof item.ar !== "string") || (item.en !== undefined && typeof item.en !== "string")) throw invalid(`Invalid ${field} entry`);
      return { ar: (item.ar || "").trim(), en: (item.en || "").trim() };
    }).filter(item => item.ar || item.en);
  }
  if (data.curriculum) data.modules = data.curriculum.length;
  return data;
}

/** Decode uploads before writing. Certificate previews stay PNG, including transparency. */
export async function saveCourseAssets(files = {}) {
  const outputs = [];
  for (const [field, target, extension] of [["courseImage", "imageUrl", "webp"], ["certificateSample", "certificateSampleUrl", "png"]]) {
    const file = files[field]?.[0];
    if (!file) continue;
    let data;
    try {
      const image = sharp(file.buffer, { limitInputPixels: 30_000_000, animated: false, failOn: "error" });
      const metadata = await image.metadata();
      if ((metadata.pages || 1) > 1 || !["jpeg", "png", "webp"].includes(metadata.format)) throw new Error("Unsupported image");
      if (field === "certificateSample" && metadata.format !== "png") throw new Error("PNG required");
      data = field === "certificateSample"
        ? await image.png().toBuffer()
        : await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
    } catch {
      throw invalid(field === "certificateSample" ? "Certificate sample must be a valid, non-animated PNG image" : "Course image is invalid or too large");
    }
    outputs.push({ target, extension, data });
  }
  const now = new Date();
  const folder = `courses/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const directory = path.join(config.uploadDir, folder);
  const written = [];
  const cleanup = async () => { await Promise.all(written.map(file => fs.unlink(file).catch(() => {}))); };
  const fields = {};
  try {
    if (outputs.length) await fs.mkdir(directory, { recursive: true });
    for (const output of outputs) {
      const name = `${crypto.randomUUID()}.${output.extension}`;
      const file = path.join(directory, name);
      await fs.writeFile(file, output.data, { flag: "wx" });
      written.push(file);
      fields[output.target] = `/uploads/${folder}/${name}`;
    }
  } catch (error) { await cleanup(); throw error; }
  return { fields, cleanup };
}
