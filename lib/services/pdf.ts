import chromium from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';

let browserInstance: Browser | null = null;
const isLocal = process.env.NODE_ENV === 'development';

const chromeArgs = [
  '--font-render-hinting=none',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-animations',
  '--disable-background-timer-throttling',
  '--disable-restore-session-state',
  '--single-process',
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
      const executablePath = await chromium.executablePath();
      browserInstance = await puppeteer.launch({
        args: chromeArgs,
        executablePath,
        headless: true,
      }) as Browser;
    }

    return browserInstance;
  } catch (error: any) {
    console.error('Failed to launch browser:', error);
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
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
    console.log('PDF generation - Content set');

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
