import { chromium } from "playwright";
import fs from "node:fs/promises";

await fs.mkdir("preview-screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

async function shot(name) {
  await page.screenshot({ path: `preview-screenshots/${name}.png`, fullPage: true });
}

try {
  await page.goto("http://127.0.0.1:3000/admin/login", { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(process.env.ADMIN_EMAIL || "admin@iard-academy.org");
  await page.locator('input[name="password"]').fill(process.env.ADMIN_PASSWORD || "");
  await page.locator('button.btn-primary').click();
  await page.waitForURL(/\/admin\/?$/);
  await page.waitForTimeout(800);
  await shot("01-admin-overview");

  await page.getByRole("button", { name: /التصنيفات|Categories/ }).click();
  await page.waitForTimeout(500);
  await shot("02-admin-categories");

  await page.getByRole("button", { name: /الكورسات|Courses/ }).click();
  await page.waitForTimeout(700);
  await shot("03-admin-courses-pagination");
  await page.getByRole("button", { name: /إنشاء دورة|Create Course/ }).click();
  await page.waitForTimeout(250);
  await shot("04-create-course-modal");
  await page.locator(".modal").evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.waitForTimeout(150);
  await shot("04b-create-course-curriculum");
  await page.locator(".modal-head button").click();

  await page.getByRole("button", { name: /الشهادات|Certificates/ }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /رفع شهادة|Upload Certificate/ }).click();
  await page.waitForTimeout(250);
  await shot("05-certificate-modal");

  await page.goto("http://127.0.0.1:3000/courses", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await shot("06-public-courses-pagination");

  await page.goto("http://127.0.0.1:3000/courses/preview-course-01", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("07-course-overview");
  await page.getByRole("button", { name: /المحاور|Curriculum/ }).click();
  await page.waitForTimeout(200);
  await shot("08-course-curriculum");
} finally {
  await browser.close();
}
