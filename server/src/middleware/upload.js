import multer from "multer";
import { config } from "../config.js";

const badFile = message => Object.assign(new Error(message), { status: 400 });
const certificateTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
export const uploadCertificate = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter(_req, file, cb) {
    certificateTypes.has(file.mimetype) ? cb(null, true) : cb(badFile("Only JPG, PNG, WebP, or PDF allowed"));
  },
}).single("certificateFile");

export const uploadCourseAssets = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 2, fields: 1, fieldSize: 512 * 1024 },
  fileFilter(_req, file, cb) {
    const valid = file.fieldname === "certificateSample"
      ? file.mimetype === "image/png"
      : file.fieldname === "courseImage" && ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    valid ? cb(null, true) : cb(badFile(file.fieldname === "certificateSample" ? "Certificate sample must be a PNG image" : "Course image must be JPG, PNG, or WebP"));
  },
}).fields([{ name: "courseImage", maxCount: 1 }, { name: "certificateSample", maxCount: 1 }]);
