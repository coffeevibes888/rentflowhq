import chromium from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';

let browserInstance: Browser | null = null;
const isLocal = process.env.NODE_ENV === 'development';

// Optimized args for serverless environments
const chromeArgs = [
  ...chromium.args,
  '--font-render-hinting=none',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-animations',
  '--disable-background-timer-throttling',
  '--disable-restore-session-state',
  '--single-process',
  '--no-zygote',
];

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  try {
    if (isLocal) {
      // For local development, use installed Chrome
      browserInstance = await puppeteer.launch({
        channel: 'chrome',
        headless: true,
      }) as Browser;
    } else {
      // For Vercel/production, use @sparticuz/chromium
      console.log('PDF - Getting chromium executable path...');
      const executablePath = await chromium.executablePath();
      console.log('PDF - Executable path:', executablePath);
      
      browserInstance = await puppeteer.launch({
        args: chromeArgs,
        executablePath,
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      }) as Browser;
      console.log('PDF - Browser launched successfully');
    }

    return browserInstance;
  } catch (error: any) {
    console.error('Failed to launch browser:', error);
    console.error('Error details:', error.message, error.stack);
    throw new Error('PDF generation service unavailable. Please try again later.');
  }
}

export async function htmlToPdfBuffer(html: string): Promise<Buffer> {
  console.log('PDF generation - Starting...');
  const browser = await getBrowser();
  console.log('PDF generation - Browser launched');

  const page = await browser.newPage();
  console.log('PDF generation - New page created');

  try {
    await page.setViewport({ width: 850, height: 1100 });
    await page.emulateMediaType('print');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('PDF generation - Content set');

    // Wait for all images to load (including base64 data URLs)
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });
    console.log('PDF generation - Images loaded');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
    console.log('PDF generation - PDF created, size:', pdf.length, 'bytes');

    return Buffer.from(pdf);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF document.');
  } finally {
    await page.close();
    // Close browser in local dev to avoid resource leaks
    if (isLocal && browserInstance) {
      await browserInstance.close();
      browserInstance = null;
    }
  }
}
