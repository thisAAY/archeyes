// Real-browser E2E (the eng-review decision): drive the actual React Flow canvas,
// then assert the feedback envelope the CLI prints to stdout. Requires a built UI
// bundle (npm run build:ui) and browsers (npx playwright install chromium).
import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, readdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..");
const CLI = join(ROOT, "cli", "archeyes.ts");
const FIXTURE = join(ROOT, "test", "fixtures", "order-payment.graph.json");

let proc: ChildProcess;
let stdout = "";
let baseURL = "";

async function sessionFrom(repo: string): Promise<{ port: number; token: string }> {
  const dir = join(repo, ".archeyes", "sessions");
  for (let i = 0; i < 100; i++) {
    try {
      const tok = readdirSync(dir)[0];
      const s = JSON.parse(readFileSync(join(dir, tok, "session.json"), "utf8"));
      if (s.port > 0) return { port: s.port, token: s.token };
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("session never became ready");
}

test.beforeAll(async () => {
  const repo = mkdtempSync(join(tmpdir(), "archeyes-e2e-"));
  proc = spawn(process.execPath, ["--experimental-strip-types", CLI, "review", FIXTURE, "--no-open", "--idle-ms", "120000"], {
    cwd: repo,
    stdio: ["ignore", "pipe", "pipe"],
  });
  proc.stdout!.on("data", (d) => (stdout += d.toString()));
  const { port, token } = await sessionFrom(repo);
  baseURL = `http://127.0.0.1:${port}/?token=${token}`;
});

test.afterAll(() => {
  try {
    proc.kill("SIGKILL");
  } catch {
    /* gone */
  }
});

test("renders the authored graph with diff-styled nodes", async ({ page }) => {
  await page.goto(baseURL);
  await expect(page.getByText("Split payment flow out of OrderService")).toBeVisible();
  await expect(page.locator(".ax-node", { hasText: "OrderService" })).toBeVisible();
  const payment = page.locator(".ax-node", { hasText: "PaymentService" });
  await expect(payment).toBeVisible();
  // diff channel: PaymentService is "new" → thick-solid class + "new" status pill
  await expect(payment).toHaveClass(/ax-status-new/);
  await expect(payment.locator(".ax-status-pill")).toContainText("new");
});

test("comment on a node → Send → feedback envelope carries it", async ({ page }) => {
  await page.goto(baseURL);
  await page.locator(".ax-node", { hasText: "OrderService" }).click(); // selects → Inspector tab
  const box = page.getByPlaceholder(/Add feedback for the agent/);
  await box.fill("move token refresh into @PaymentService");
  await page.getByRole("button", { name: "Add comment" }).click();
  // the Changes tab badge is the always-visible pending count
  await expect(page.locator(".ax-tab-badge")).toHaveText("1");
  await page.getByRole("button", { name: /Send 1 change/ }).click();

  await expect(async () => {
    const envelope = JSON.parse(stdout.trim());
    expect(envelope.action).toBe("revise");
    expect(envelope.comments[0].nodeId).toBe("OrderService");
    expect(envelope.comments[0].text).toContain("@PaymentService");
  }).toPass({ timeout: 5000 });
});
