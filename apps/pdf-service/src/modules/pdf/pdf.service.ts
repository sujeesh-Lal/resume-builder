import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import puppeteer from 'puppeteer';
import { AppLogger } from '@resume-platform/logger';
import { ResumeData } from '@resume-platform/shared-types';

@Injectable()
export class PdfService {
  private readonly logger = new AppLogger('PdfService');
  private readonly resumeServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.resumeServiceUrl =
      this.config.get<string>('RESUME_SERVICE_URL') ?? 'http://localhost:3001';
  }

  async generatePdf(resumeId: string, template: string, format = 'A4'): Promise<Buffer> {
    this.logger.info('Generating PDF', { resumeId, template, format });

    // Fetch resume data
    const { data: resume } = await firstValueFrom(
      this.http.get<ResumeData>(`${this.resumeServiceUrl}/resumes/${resumeId}`),
    );

    // Build HTML
    const html = this.buildResumeHtml(resume, template);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: format as 'A4' | 'Letter',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });

      this.logger.info('PDF generated', { resumeId });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildResumeHtml(resume: ResumeData, template: string): string {
    const templateStyles = this.getTemplateStyles(template);
    const { personalInfo, summary, experience, education, skills, projects, certifications } =
      resume;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    ${templateStyles}
  </style>
</head>
<body>
  <div class="resume">
    <header class="header">
      <h1>${personalInfo.fullName ?? ''}</h1>
      <div class="contact">
        ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
        ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ''}
        ${personalInfo.location ? `<span>${personalInfo.location}</span>` : ''}
        ${personalInfo.linkedin ? `<span>${personalInfo.linkedin}</span>` : ''}
        ${personalInfo.github ? `<span>${personalInfo.github}</span>` : ''}
      </div>
    </header>

    ${
      summary
        ? `<section class="section">
      <h2>Summary</h2>
      <p>${summary}</p>
    </section>`
        : ''
    }

    ${
      experience?.length
        ? `<section class="section">
      <h2>Experience</h2>
      ${experience
        .map(
          (exp: any) => `
        <div class="entry">
          <div class="entry-header">
            <strong>${exp.position}</strong> — ${exp.company}
            <span class="date">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate ?? ''}</span>
          </div>
          <p>${exp.description ?? ''}</p>
          ${exp.highlights?.length ? `<ul>${exp.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
        </div>
      `,
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      education?.length
        ? `<section class="section">
      <h2>Education</h2>
      ${education
        .map(
          (edu: any) => `
        <div class="entry">
          <div class="entry-header">
            <strong>${edu.degree} in ${edu.field}</strong> — ${edu.institution}
            <span class="date">${edu.startDate} – ${edu.current ? 'Present' : edu.endDate ?? ''}</span>
          </div>
        </div>
      `,
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      skills?.length
        ? `<section class="section">
      <h2>Skills</h2>
      <div class="skills-grid">
        ${skills.map((s: any) => `<span class="skill-tag">${s.name}</span>`).join('')}
      </div>
    </section>`
        : ''
    }

    ${
      projects?.length
        ? `<section class="section">
      <h2>Projects</h2>
      ${projects
        .map(
          (proj: any) => `
        <div class="entry">
          <div class="entry-header">
            <strong>${proj.name}</strong>
            ${proj.url ? `<a href="${proj.url}">${proj.url}</a>` : ''}
          </div>
          <p>${proj.description ?? ''}</p>
          ${proj.technologies?.length ? `<div class="skills-grid">${proj.technologies.map((t: string) => `<span class="skill-tag">${t}</span>`).join('')}</div>` : ''}
        </div>
      `,
        )
        .join('')}
    </section>`
        : ''
    }

    ${
      certifications?.length
        ? `<section class="section">
      <h2>Certifications</h2>
      ${certifications
        .map(
          (cert: any) => `
        <div class="entry">
          <div class="entry-header">
            <strong>${cert.name}</strong> — ${cert.issuer}
            <span class="date">${cert.date}</span>
          </div>
        </div>
      `,
        )
        .join('')}
    </section>`
        : ''
    }
  </div>
</body>
</html>`;
  }

  private getTemplateStyles(template: string): string {
    const base = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.5; }
      .resume { max-width: 800px; margin: 0 auto; padding: 20px; }
      .section { margin-bottom: 20px; }
      .section h2 { font-size: 14pt; border-bottom: 2px solid currentColor; padding-bottom: 4px; margin-bottom: 12px; }
      .entry { margin-bottom: 12px; }
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
      .date { font-size: 10pt; color: #666; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .skill-tag { padding: 2px 10px; border-radius: 12px; font-size: 10pt; }
      ul { margin-left: 18px; margin-top: 4px; }
      a { color: inherit; }
    `;

    const themes: Record<string, string> = {
      modern: `
        ${base}
        .header { background: #1e40af; color: white; padding: 24px; border-radius: 4px; margin-bottom: 20px; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; opacity: 0.9; }
        .section h2 { color: #1e40af; }
        .skill-tag { background: #dbeafe; color: #1e40af; }
      `,
      classic: `
        ${base}
        .header { border-bottom: 3px double #333; padding-bottom: 16px; margin-bottom: 20px; text-align: center; }
        .header h1 { font-size: 22pt; }
        .header .contact { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; }
        .section h2 { color: #333; text-transform: uppercase; letter-spacing: 1px; font-size: 11pt; }
        .skill-tag { background: #f3f4f6; color: #333; border: 1px solid #d1d5db; }
      `,
      minimal: `
        ${base}
        .header { margin-bottom: 24px; }
        .header h1 { font-size: 24pt; font-weight: 300; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px; font-size: 10pt; color: #666; }
        .section h2 { color: #000; font-weight: 400; font-size: 12pt; letter-spacing: 2px; text-transform: uppercase; }
        .skill-tag { background: transparent; border: 1px solid #999; color: #555; }
      `,
      creative: `
        ${base}
        .header { background: linear-gradient(135deg, #7c3aed, #db2777); color: white; padding: 28px; border-radius: 8px; margin-bottom: 24px; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; opacity: 0.85; }
        .section h2 { color: #7c3aed; }
        .skill-tag { background: #f3e8ff; color: #7c3aed; }
      `,
    };

    return themes[template] ?? themes['modern'];
  }
}
