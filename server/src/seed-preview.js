import mongoose from "mongoose";
import { connectDatabase } from "./db.js";
import { Category, Course } from "./models/index.js";

await connectDatabase();

const category = await Category.findOneAndUpdate(
  { slug: "preview-programming" },
  { name: { ar: "برمجة وتطوير", en: "Programming & Development" }, slug: "preview-programming", active: true, sortOrder: 1 },
  { upsert: true, new: true, runValidators: true },
);

for (let i = 1; i <= 12; i += 1) {
  const n = String(i).padStart(2, "0");
  await Course.findOneAndUpdate(
    { code: `PREVIEW-${n}` },
    {
      code: `PREVIEW-${n}`,
      slug: `preview-course-${n}`,
      title: { ar: `دورة تجريبية ${n}`, en: `Preview Course ${n}` },
      summary: { ar: "برنامج تدريبي عملي لعرض تجربة الكورس داخل المنصة.", en: "A practical preview course for the platform." },
      description: { ar: "وصف تجريبي للكورس مع محتوى منظم وواضح.", en: "Preview course description with clear structured content." },
      details: { ar: "تطبيقات عملية وتمارين ومتابعة مع المدرب.", en: "Hands-on exercises with instructor support." },
      category: category.name,
      categoryId: category._id,
      duration: `${20 + i} ساعة`,
      instructor: { name: "فريق I.A.R.D" },
      status: "published",
      curriculum: [
        { ar: "المحور الأول: الأساسيات", en: "Module 1: Foundations" },
        { ar: "المحور الثاني: التطبيق العملي", en: "Module 2: Practical Application" },
        { ar: "المحور الثالث: المشروع النهائي", en: "Module 3: Final Project" }
      ],
      learningOutcomes: [
        { ar: "فهم المفاهيم الأساسية", en: "Understand the foundations" },
        { ar: "تطبيق المهارات ضمن مشروع عملي", en: "Apply skills in a practical project" }
      ]
    },
    { upsert: true, new: true, runValidators: true },
  );
}

await mongoose.connection.close();
console.log("Preview catalog seeded");
