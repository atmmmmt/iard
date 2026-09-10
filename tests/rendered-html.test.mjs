import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const { default: worker } = await import(new URL("../dist/server/index.js", import.meta.url).href);
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

// Validate the academy's production HTML, rather than the removed starter preview tag.
for (const [path, heading] of [["/", "تعلّم مهارات اليوم"], ["/courses", "استكشف برامجنا التدريبية"], ["/verify", "التحقق من المعلومات"]]) {
  test(`renders the public ${path} route with accessible branded loading`, async () => {
    const response = await worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.ok(html.includes(heading), "The route's actual page content must render after its loading fallback");
    assert.match(html, /role="status" aria-live="polite"/);
    assert.match(html, /src="\/brand\/iard-symbol\.png"/);
    assert.match(html, /<noscript><style>\.site-intro\{display:none!important\}/);
    assert.doesNotMatch(html, /<a[^>]*class="[^"]*profile-btn/);
  });
}

test("all generated responsive assets are present in the built site", async () => {
  for (const file of ["academy-syria-hero.webp", "academy-syria-hero-mobile.webp", "academy-syria-learning.webp"]) {
    const data = await readFile(new URL(`../dist/client/images/${file}`, import.meta.url));
    assert.equal(data.subarray(8, 12).toString(), "WEBP");
    assert.ok(data.length < 150_000, "Website imagery should remain lightweight");
  }
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
});
