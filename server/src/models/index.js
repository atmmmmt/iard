import mongoose from "mongoose";

const { Schema, model } = mongoose;
const bi = {
  ar: { type: String, trim: true },
  en: { type: String, trim: true },
};

const user = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["super_admin", "admin", "editor", "viewer"], default: "admin" },
  active: { type: Boolean, default: true },
  lastLoginAt: Date,
}, { timestamps: true });

const category = new Schema({
  name: {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  active: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const course = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  title: bi,
  summary: bi,
  description: bi,
  // Mixed keeps legacy string categories readable while new courses store { ar, en }.
  category: { type: Schema.Types.Mixed, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced", "professional"], default: "professional" },
  duration: String,
  modules: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  instructor: { name: String, title: String, photoUrl: String },
  learningOutcomes: [{ ar: String, en: String }],
  curriculum: [{ ar: String, en: String }],
  details: bi,
  format: bi,
  imageUrl: String,
  certificateSampleUrl: String,
  brochureUrl: String,
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
  enrollmentCount: { type: Number, default: 0 },
  sortOrder: { type: Number, default: 0 },
  seo: { title: bi, description: bi },
}, { timestamps: true });

const student = new Schema({
  studentId: { type: String, required: true, unique: true, uppercase: true },
  fullName: bi,
  email: { type: String, lowercase: true },
  phone: String,
  country: bi,
  city: bi,
  bio: bi,
  profilePhotoUrl: String,
  joinedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["active", "suspended", "archived"], default: "active", index: true },
  publicProfile: { type: Boolean, default: true },
  completedCourseCodes: [String],
}, { timestamps: true });

const certificate = new Schema({
  certificateNumber: { type: String, required: true, unique: true, uppercase: true },
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", index: true },
  courseTitle: bi,
  issueDate: { type: Date, required: true },
  expiryDate: Date,
  grade: bi,
  originalFileUrl: String,
  optimizedImageUrl: String,
  mimeType: String,
  fileSize: Number,
  status: { type: String, enum: ["verified", "revoked", "expired"], default: "verified", index: true },
  notes: String,
}, { timestamps: true });
certificate.index({ certificateNumber: 1, student: 1, issueDate: -1 });

const setting = new Schema({
  key: { type: String, default: "platform", unique: true },
  academyName: bi,
  tagline: bi,
  about: bi,
  contact: { email: String, phone: String, whatsapp: String, address: bi },
  social: { facebook: String, instagram: String, linkedin: String },
  logoUrl: String,
  defaultLanguage: { type: String, enum: ["ar", "en"], default: "ar" },
}, { timestamps: true });

const audit = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  entity: String,
  entityId: String,
  ip: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: true });
audit.index({ createdAt: -1 });

export const User = model("User", user);
export const Category = model("Category", category);
export const Course = model("Course", course);
export const Student = model("Student", student);
export const Certificate = model("Certificate", certificate);
export const SiteSetting = model("SiteSetting", setting);
export const AuditLog = model("AuditLog", audit);
