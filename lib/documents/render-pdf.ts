import "server-only";
import { existsSync } from "fs";

/**
 * Render an HTML document to a PDF buffer using headless Chromium.
 *
 * - On serverless platforms (Vercel / AWS Lambda) it uses `@sparticuz/chromium`.
 * - Locally it uses a system Chrome/Chromium (override with CHROME_EXECUTABLE_PATH).
 *
 * The `puppeteer-core` / `@sparticuz/chromium` modules are imported through
 * indirect specifiers so the app still builds when they are not installed; they
 * are only required at request time when a PDF is actually generated.
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.AWS_REGION;

  const puppeteerSpecifier = "puppeteer-core";
  const chromiumSpecifier = "@sparticuz/chromium";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const puppeteer: any = await import(/* webpackIgnore: true */ puppeteerSpecifier);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any;

  if (isServerless) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromium: any = (await import(/* webpackIgnore: true */ chromiumSpecifier))
      .default;
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  } else {
    browser = await puppeteer.launch({
      executablePath: resolveLocalChrome(),
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function resolveLocalChrome(): string {
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(
    "No local Chrome/Chromium found for PDF rendering. Set CHROME_EXECUTABLE_PATH.",
  );
}
