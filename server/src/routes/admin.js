import express from "express";
import mongoose from "mongoose";
import { allowRoles, requireAuth } from "../middleware/auth.js";
import { uploadCertificate, uploadCourseAssets } from "../middleware/upload.js";
import { coursePayload, saveCourseAssets } from "../course-assets.js";
import { AuditLog, Category, Certificate, Course, SiteSetting, Student, User } from "../models/index.js";
import { asyncRoute, normalizeCode, pagination, recordAudit, saveCertificateFile } from "../utils.js";

const router = express.Router();
router.use(requireAuth);

router.get("/dashboard", asyncRoute(async (_req, res) => {
  const [students, courses, certificates, recentActivity] = await Promise.all([
    Student.countDocuments({ status: "active" }),
    Course.countDocuments({ status: "published" }),
    Certificate.countDocuments({ status: "verified" }),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  res.json({ students, courses, certificates, recentActivity });
}));

const list = (Model, defaultLimit = 20) => asyncRoute(async (req, res) => {
  const { page, limit, skip } = pagination(req.query, defaultLimit);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const q = String(req.query.q);
    filter.$or = [
      { code: { $regex: q, $options: "i" } },
      { studentId: { $regex: q, $options: "i" } },
      { certificateNumber: { $regex: q, $options: "i" } },
      { "title.ar": { $regex: q, $options: "i" } },
      { "title.en": { $regex: q, $options: "i" } },
      { "fullName.ar": { $regex: q, $options: "i" } },
      { "fullName.en": { $regex: q, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

function categorySlug(value = "") {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `category-${Date.now()}`;
}

async function resolveCategory(categoryId) {
  if (!categoryId || !mongoose.isValidObjectId(categoryId)) return null;
  return Category.findOne({ _id: categoryId, active: true }).lean();
}

router.get("/categories", asyncRoute(async (req, res) => {
  const filter = req.query.includeInactive === "1" ? {} : { active: true };
  if (req.query.q) {
    const q = String(req.query.q);
    filter.$or = [{ "name.ar": { $regex: q, $options: "i" } }, { "name.en": { $regex: q, $options: "i" } }];
  }
  const items = await Category.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json(items);
}));

router.post("/categories", allowRoles("super_admin", "admin", "editor"), asyncRoute(async (req, res) => {
  const ar = String(req.body?.name?.ar || "").trim();
  const en = String(req.body?.name?.en || "").trim();
  if (!ar || !en) return res.status(400).json({ message: "Arabic and English category names are required" });
  const item = await Category.create({ name: { ar, en }, slug: categorySlug(req.body.slug || en), sortOrder: Number(req.body.sortOrder || 0) });
  await recordAudit(req, "category.create", "Category", item.id);
  res.status(201).json(item);
}));

router.patch("/categories/:id", allowRoles("super_admin", "admin", "editor"), asyncRoute(async (req, res) => {
  const patch = {};
  if (req.body.name) {
    const ar = String(req.body.name.ar || "").trim();
    const en = String(req.body.name.en || "").trim();
    if (!ar || !en) return res.status(400).json({ message: "Arabic and English category names are required" });
    patch.name = { ar, en };
  }
  if (req.body.slug) patch.slug = categorySlug(req.body.slug);
  if (req.body.sortOrder !== undefined) patch.sortOrder = Number(req.body.sortOrder || 0);
  if (req.body.active !== undefined) patch.active = Boolean(req.body.active);
  const item = await Category.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Category not found" });
  if (patch.name) await Course.updateMany({ categoryId: item._id }, { $set: { category: patch.name } });
  await recordAudit(req, "category.update", "Category", item.id);
  res.json(item);
}));

router.delete("/categories/:id", allowRoles("super_admin", "admin"), asyncRoute(async (req, res) => {
  const item = await Category.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!item) return res.status(404).json({ message: "Category not found" });
  await recordAudit(req, "category.archive", "Category", item.id);
  res.json(item);
}));

router.get("/courses", list(Course));
router.post("/courses", allowRoles("super_admin", "admin", "editor"), uploadCourseAssets, asyncRoute(async (req, res) => {
  const data = coursePayload(req);
  if (!data.code || !data.slug || !data.title?.ar || !data.title?.en) return res.status(400).json({ message: "Bilingual title, code and slug required" });
  const category = await resolveCategory(data.categoryId);
  if (!category) return res.status(400).json({ message: "Please select a valid category" });
  data.categoryId = category._id;
  data.category = category.name;
  const uploads = await saveCourseAssets(req.files);
  let item;
  try {
    item = await Course.create({ ...data, ...uploads.fields, code: normalizeCode(data.code) });
  } catch (error) {
    await uploads.cleanup();
    throw error;
  }
  await recordAudit(req, "course.create", "Course", item.id);
  res.status(201).json(item);
}));

router.patch("/courses/:id", allowRoles("super_admin", "admin", "editor"), uploadCourseAssets, asyncRoute(async (req, res) => {
  const data = coursePayload(req);
  if (data.categoryId !== undefined) {
    const category = await resolveCategory(data.categoryId);
    if (!category) return res.status(400).json({ message: "Please select a valid category" });
    data.categoryId = category._id;
    data.category = category.name;
  }
  const uploads = await saveCourseAssets(req.files);
  let item;
  try {
    item = await Course.findByIdAndUpdate(req.params.id, { $set: { ...data, ...uploads.fields } }, { new: true, runValidators: true });
  } catch (error) {
    await uploads.cleanup();
    throw error;
  }
  if (!item) {
    await uploads.cleanup();
    return res.status(404).json({ message: "Course not found" });
  }
  await recordAudit(req, "course.update", "Course", item.id);
  res.json(item);
}));

router.delete("/courses/:id", allowRoles("super_admin", "admin"), asyncRoute(async (req, res) => {
  const item = await Course.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
  if (!item) return res.status(404).json({ message: "Course not found" });
  await recordAudit(req, "course.archive", "Course", item.id);
  res.json(item);
}));

router.get("/students", list(Student));
router.post("/students", allowRoles("super_admin", "admin", "editor"), asyncRoute(async (req, res) => {
  if (!req.body.studentId || !req.body.fullName?.ar || !req.body.fullName?.en) return res.status(400).json({ message: "Student ID and bilingual name required" });
  const item = await Student.create({ ...req.body, studentId: normalizeCode(req.body.studentId) });
  await recordAudit(req, "student.create", "Student", item.id);
  res.status(201).json(item);
}));
router.patch("/students/:id", allowRoles("super_admin", "admin", "editor"), asyncRoute(async (req, res) => {
  delete req.body._id;
  const item = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Student not found" });
  await recordAudit(req, "student.update", "Student", item.id);
  res.json(item);
}));
router.delete("/students/:id", allowRoles("super_admin", "admin"), asyncRoute(async (req, res) => {
  const item = await Student.findByIdAndUpdate(req.params.id, { status: "archived", publicProfile: false }, { new: true });
  if (!item) return res.status(404).json({ message: "Student not found" });
  res.json(item);
}));

router.get("/certificates", list(Certificate));
router.post("/certificates", allowRoles("super_admin", "admin", "editor"), uploadCertificate, asyncRoute(async (req, res) => {
  if (!req.body.certificateNumber) return res.status(400).json({ message: "Certificate number is required" });
  if (!req.body.studentId) return res.status(400).json({ message: "Student ID is required" });
  if (!req.body.courseId) return res.status(400).json({ message: "Please select a course" });
  if (!req.body.issueDate) return res.status(400).json({ message: "Issue date is required" });
  if (!req.file) return res.status(400).json({ message: "Certificate file is required" });

  const student = await Student.findOne({ studentId: normalizeCode(req.body.studentId) });
  if (!student) return res.status(404).json({ message: `Student ${normalizeCode(req.body.studentId)} was not found. Add the student first.` });
  if (!mongoose.isValidObjectId(req.body.courseId)) return res.status(400).json({ message: "Selected course is invalid" });
  const course = await Course.findById(req.body.courseId).lean();
  if (!course) return res.status(404).json({ message: "Selected course was not found" });

  const item = await Certificate.create({
    certificateNumber: normalizeCode(req.body.certificateNumber),
    student: student._id,
    course: course._id,
    courseTitle: course.title,
    issueDate: req.body.issueDate,
    grade: { ar: req.body.gradeAr || "", en: req.body.gradeEn || "" },
    status: req.body.status || "verified",
    ...await saveCertificateFile(req.file),
  });
  await recordAudit(req, "certificate.create", "Certificate", item.id, { courseId: String(course._id), studentId: student.studentId });
  res.status(201).json(item);
}));
router.patch("/certificates/:id", allowRoles("super_admin", "admin", "editor"), asyncRoute(async (req, res) => {
  delete req.body._id;
  const item = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  item ? res.json(item) : res.status(404).json({ message: "Certificate not found" });
}));
router.delete("/certificates/:id", allowRoles("super_admin", "admin"), asyncRoute(async (req, res) => {
  const item = await Certificate.findByIdAndUpdate(req.params.id, { status: "revoked" }, { new: true });
  item ? res.json(item) : res.status(404).json({ message: "Certificate not found" });
}));

router.get("/settings", asyncRoute(async (_req, res) => res.json(await SiteSetting.findOne({ key: "platform" }).lean() || {})));
router.put("/settings", allowRoles("super_admin", "admin"), asyncRoute(async (req, res) => {
  delete req.body._id;
  delete req.body.key;
  const item = await SiteSetting.findOneAndUpdate({ key: "platform" }, { ...req.body, key: "platform" }, { upsert: true, new: true, runValidators: true });
  await recordAudit(req, "settings.update", "SiteSetting", item.id);
  res.json(item);
}));
router.get("/activity", allowRoles("super_admin", "admin"), list(AuditLog, 30));
router.get("/administrators", allowRoles("super_admin"), asyncRoute(async (_req, res) => res.json(await User.find().select("name email role active lastLoginAt createdAt").lean())));

export default router;
