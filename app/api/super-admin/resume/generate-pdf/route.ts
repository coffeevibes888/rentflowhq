import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'superAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resume, template } = await request.json();

    const html = generateResumeHTML(resume, template);

    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      ),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume.personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function generateResumeHTML(resume: any, template: string) {
  const { personalInfo, summary, experience, education, skills, certifications } = resume;

  if (template === 'modern') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background: white;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 40px; }
            .header {
              border-bottom: 4px solid #7c3aed;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            h1 {
              font-size: 36px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 10px;
            }
            .contact {
              display: flex;
              gap: 15px;
              font-size: 14px;
              color: #64748b;
              flex-wrap: wrap;
            }
            .contact span:not(:last-child)::after {
              content: '•';
              margin-left: 15px;
            }
            .section {
              margin-bottom: 30px;
            }
            h2 {
              font-size: 20px;
              font-weight: 700;
              color: #7c3aed;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary {
              color: #475569;
              line-height: 1.8;
            }
            .experience-item {
              margin-bottom: 25px;
            }
            .experience-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .job-title {
              font-weight: 700;
              font-size: 16px;
              color: #0f172a;
            }
            .company {
              color: #475569;
              font-size: 15px;
            }
            .date {
              color: #64748b;
              font-size: 14px;
              white-space: nowrap;
            }
            ul {
              margin-left: 20px;
              margin-top: 10px;
            }
            li {
              color: #475569;
              font-size: 14px;
              margin-bottom: 6px;
            }
            .skills {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .skill-tag {
              background: #ede9fe;
              color: #6d28d9;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 500;
            }
            .education-item {
              margin-bottom: 20px;
            }
            .degree {
              font-weight: 700;
              font-size: 16px;
              color: #0f172a;
            }
            .school {
              color: #475569;
              font-size: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${personalInfo.name}</h1>
              <div class="contact">
                <span>${personalInfo.location}</span>
                <span>${personalInfo.email}</span>
                <span>${personalInfo.phone}</span>
              </div>
            </div>

            ${summary ? `
              <div class="section">
                <h2>Professional Summary</h2>
                <p class="summary">${summary}</p>
              </div>
            ` : ''}

            ${experience.length > 0 ? `
              <div class="section">
                <h2>Experience</h2>
                ${experience.map((exp: any) => `
                  <div class="experience-item">
                    <div class="experience-header">
                      <div>
                        <div class="job-title">${exp.title}</div>
                        <div class="company">${exp.company} - ${exp.location}</div>
                      </div>
                      <div class="date">${exp.startDate} - ${exp.endDate}</div>
                    </div>
                    <ul>
                      ${exp.bullets.map((bullet: string) => `<li>${bullet}</li>`).join('')}
                    </ul>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${education.length > 0 ? `
              <div class="section">
                <h2>Education & Training</h2>
                ${education.map((edu: any) => `
                  <div class="education-item">
                    <div class="experience-header">
                      <div>
                        <div class="degree">${edu.degree}</div>
                        <div class="school">${edu.school} - ${edu.location}</div>
                      </div>
                      <div class="date">${edu.years}</div>
                    </div>
                    ${edu.details.length > 0 ? `
                      <ul>
                        ${edu.details.map((detail: string) => `<li>${detail}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${skills.length > 0 ? `
              <div class="section">
                <h2>Key Skills</h2>
                <div class="skills">
                  ${skills.map((skill: string) => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            ${certifications && certifications.length > 0 ? `
              <div class="section">
                <h2>Certifications</h2>
                <ul>
                  ${certifications.map((cert: string) => `<li>${cert}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }

  return '<html><body><p>Template not found</p></body></html>';
}
