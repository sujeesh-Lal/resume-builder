import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';
import { AppLogger } from '@resume-platform/logger';
import { ResumeData } from '@resume-platform/shared-types';

@Injectable()
export class PdfService {
  private readonly logger = new AppLogger('PdfService');

  constructor(private readonly config: ConfigService) {}

  // Phase 1: resume data is passed directly from the frontend (stored in localStorage,
  // not yet persisted to MongoDB). Phase 2 will switch to fetching by ID once auth lands.
  async generatePdf(resume: ResumeData, format = 'A4'): Promise<Buffer> {
    this.logger.info('Generating PDF', {
      resumeId: resume.id,
      template: resume.template,
      format,
    });

    const html = this.buildResumeHtml(resume, resume.template);

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

      this.logger.info('PDF generated', { resumeId: resume.id });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildResumeHtml(resume: ResumeData, template: string): string {
    if (template === 'elegant') {
      return this.buildElegantHtml(resume);
    }
    return this.buildGenericHtml(resume, template);
  }

  // ─── Elegant template ──────────────────────────────────────────────────────
  /** Normalise description: may be legacy string or new string[] */
  private toDescItems(d: string | string[] | undefined): string[] {
    if (!d) return [];
    if (Array.isArray(d)) return (d as string[]).filter(Boolean);
    return (d as string).trim() ? [(d as string).trim()] : [];
  }

  private buildElegantHtml(resume: ResumeData): string {
    const { personalInfo: p, summary, experience, education, skills, projects, certifications, customSections } = resume;

    const professionalSkills = skills.filter(s => !s.category || s.category.toLowerCase() !== 'technical');
    const technicalSkills    = skills.filter(s => s.category?.toLowerCase() === 'technical');

    const initials = (p.fullName || 'YN')
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('');

    const sep = (text: string) => `<span class="sep"> // </span>${text}<span class="sep"> //</span>`;

    const skillsGrid = (list: typeof skills) => {
      if (!list.length) return '';
      const cells = list.map(s => `<td class="skill-cell">${s.name}</td>`);
      // pad to multiple of 4
      while (cells.length % 4 !== 0) cells.push('<td></td>');
      const rows: string[] = [];
      for (let i = 0; i < cells.length; i += 4) {
        rows.push(`<tr>${cells.slice(i, i + 4).join('')}</tr>`);
      }
      return `<table class="skills-table"><tbody>${rows.join('')}</tbody></table>`;
    };

    const sectionHtml = (title: string, body: string) => `
      <div class="section">
        <h2>${title}</h2>
        <hr class="section-rule"/>
        ${body}
      </div>`;

    const experienceHtml = experience.length ? sectionHtml('Work Experience', experience.map(exp => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${exp.company}${exp.position ? `<span class="sep"> // ${exp.position} //</span>` : ''}
          </span>
          <span class="date">${exp.startDate} – ${exp.current ? 'Present' : (exp.endDate ?? '')}</span>
        </div>
        ${exp.location ? `<div class="entry-sub">${exp.location}</div>` : ''}
        ${(() => {
          const bullets = [...this.toDescItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean);
          return bullets.length ? `<ul>${bullets.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : '';
        })()}
      </div>`).join('')) : '';

    const educationHtml = education.length ? sectionHtml('Education', education.map(edu => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${edu.degree}${edu.field ? ` | ${edu.field}` : ''}
            <span class="sep"> / ${edu.institution} /</span>
          </span>
          <span class="date">${edu.startDate} – ${edu.current ? 'Present' : (edu.endDate ?? '')}</span>
        </div>
        ${edu.gpa ? `<div class="entry-sub">GPA: ${edu.gpa}</div>` : ''}
        ${edu.highlights?.length ? `<ul>${edu.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
      </div>`).join('')) : '';

    const proSkillsHtml = professionalSkills.length
      ? sectionHtml('Professional Skills', skillsGrid(professionalSkills)) : '';

    const techSkillsHtml = technicalSkills.length
      ? sectionHtml('Technical Skills', skillsGrid(technicalSkills)) : '';

    const certHtml = certifications.length ? sectionHtml('Professional Development', certifications.map(cert => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${cert.name}${cert.issuer ? `<span class="sep"> // ${cert.issuer}</span>` : ''}
          </span>
          <span class="date">${cert.date}</span>
        </div>
      </div>`).join('')) : '';

    const projectsHtml = projects.length ? sectionHtml('Projects', projects.map(proj => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${proj.name}${proj.technologies?.length ? sep(proj.technologies.join(', ')) : ''}
          </span>
          ${proj.startDate ? `<span class="date">${proj.startDate}${proj.endDate ? ` – ${proj.endDate}` : ''}</span>` : ''}
        </div>
        ${proj.description ? `<p>${proj.description}</p>` : ''}
        ${proj.highlights?.length ? `<ul>${proj.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
      </div>`).join('')) : '';

    const customHtml = (customSections ?? []).map((cs: any) => sectionHtml(cs.title,
      cs.items.map((item: any) => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">
              ${item.title}${item.subtitle ? `<span class="sep"> // ${item.subtitle}</span>` : ''}
            </span>
            ${item.date ? `<span class="date">${item.date}</span>` : ''}
          </div>
          ${item.description ? `<p>${item.description}</p>` : ''}
        </div>`).join('')
    )).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 10pt;
      color: #222;
      line-height: 1.55;
      background: #fff;
    }
    .resume { max-width: 780px; margin: 0 auto; padding: 0 10px; }

    /* ── Header ── */
    .header { display: flex; align-items: center; gap: 22px; margin-bottom: 14px; }
    .avatar {
      width: 80px; height: 80px; border-radius: 50%;
      background: #e8e8e8; border: 1px solid #d0d0d0;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .avatar span {
      font-family: Arial, sans-serif; font-size: 20pt; font-weight: 300;
      color: #888; letter-spacing: 0.05em;
    }
    .header-text h1 {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 20pt; font-weight: 400;
      letter-spacing: 0.2em; text-transform: uppercase;
      line-height: 1.1;
    }
    .header-text .subtitle {
      font-family: Arial, sans-serif; font-size: 8.5pt;
      letter-spacing: 0.25em; text-transform: uppercase;
      color: #555; margin-top: 5px;
    }

    /* ── Contact bar ── */
    .contact-bar {
      font-family: Arial, sans-serif; font-size: 8pt;
      color: #555; display: flex; flex-wrap: wrap;
      align-items: center; gap: 0; margin-bottom: 16px;
    }
    .contact-bar .divider { margin: 0 8px; color: #bbb; }
    hr.top-rule { border: none; border-top: 1px solid #ccc; margin-bottom: 8px; }

    /* ── Sections ── */
    .section { margin-bottom: 18px; }
    .section h2 {
      font-family: Arial, sans-serif; font-size: 8.5pt; font-weight: 600;
      letter-spacing: 0.18em; text-transform: uppercase;
      color: #222; margin-bottom: 5px;
    }
    hr.section-rule { border: none; border-top: 1px solid #ccc; margin-bottom: 8px; }

    /* ── Entries ── */
    .entry { margin-bottom: 11px; }
    .entry-header {
      display: flex; justify-content: space-between;
      align-items: baseline; flex-wrap: wrap; gap: 6px;
    }
    .entry-title { font-family: Arial, sans-serif; font-size: 9pt; font-weight: 700; }
    .entry-sub { font-family: Arial, sans-serif; font-size: 8.5pt; color: #555; }
    .date { font-family: Arial, sans-serif; font-size: 8.5pt; color: #555; white-space: nowrap; }
    .sep { font-weight: 400; color: #555; }
    p { font-size: 9pt; margin-top: 3px; }
    ul { margin-left: 16px; margin-top: 3px; }
    li { font-size: 9pt; margin-bottom: 2px; }

    /* ── Skills grid ── */
    .skills-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .skill-cell {
      font-family: Arial, sans-serif; font-size: 9pt;
      color: #222; padding-bottom: 4px; width: 25%;
    }
  </style>
</head>
<body>
  <div class="resume">

    <div class="header">
      <div class="avatar"><span>${initials}</span></div>
      <div class="header-text">
        <h1>${p.fullName || 'YOUR NAME'}</h1>
        <div class="subtitle">Professional Title</div>
      </div>
    </div>

    <hr class="top-rule"/>
    <div class="contact-bar">
      ${[
        p.phone,
        p.email,
        p.linkedin,
        p.location,
        p.website,
      ].filter(Boolean).map((item, i, arr) =>
        `<span>${item}</span>${i < arr.length - 1 ? '<span class="divider">|</span>' : ''}`
      ).join('')}
    </div>

    ${summary ? sectionHtml('Summary', `<p style="margin-top:6px;font-size:9.5pt;line-height:1.6">${summary}</p>`) : ''}
    ${experienceHtml}
    ${educationHtml}
    ${proSkillsHtml}
    ${techSkillsHtml}
    ${certHtml}
    ${projectsHtml}
    ${customHtml}

  </div>
</body>
</html>`;
  }

  // ─── Generic template (modern / classic / minimal / creative) ─────────────
  private buildGenericHtml(resume: ResumeData, template: string): string {
    const templateStyles = this.getTemplateStyles(template);
    const { personalInfo, summary, experience, education, skills, projects, certifications } =
      resume;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>${templateStyles}</style>
</head>
<body>
  <div class="resume">
    <header class="header">
      <h1>${personalInfo.fullName ?? ''}</h1>
      <div class="contact">
        ${personalInfo.email ? `<span>✉ ${personalInfo.email}</span>` : ''}
        ${personalInfo.phone ? `<span>📞 ${personalInfo.phone}</span>` : ''}
        ${personalInfo.location ? `<span>📍 ${personalInfo.location}</span>` : ''}
        ${personalInfo.linkedin ? `<span>${personalInfo.linkedin}</span>` : ''}
        ${personalInfo.github ? `<span>${personalInfo.github}</span>` : ''}
        ${personalInfo.website ? `<span>${personalInfo.website}</span>` : ''}
      </div>
    </header>

    ${summary ? `<section class="section"><h2>Summary</h2><p>${summary}</p></section>` : ''}

    ${
      experience?.length
        ? `<section class="section"><h2>Experience</h2>
        ${experience.map((exp: any) => `
          <div class="entry">
            <div class="entry-header">
              <strong>${exp.position}</strong> — ${exp.company}${exp.location ? ` · ${exp.location}` : ''}
              <span class="date">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate ?? ''}</span>
            </div>
            ${(() => {
              const bullets = [...this.toDescItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean);
              return bullets.length ? `<ul>${bullets.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : '';
            })()}
          </div>`).join('')}
        </section>`
        : ''
    }

    ${
      education?.length
        ? `<section class="section"><h2>Education</h2>
        ${education.map((edu: any) => `
          <div class="entry">
            <div class="entry-header">
              <strong>${edu.degree} in ${edu.field}</strong> — ${edu.institution}
              <span class="date">${edu.startDate} – ${edu.current ? 'Present' : edu.endDate ?? ''}</span>
            </div>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
          </div>`).join('')}
        </section>`
        : ''
    }

    ${
      skills?.length
        ? `<section class="section"><h2>Skills</h2>
          <div class="skills-grid">
            ${skills.map((s: any) => `<span class="skill-tag">${s.name}</span>`).join('')}
          </div>
        </section>`
        : ''
    }

    ${
      projects?.length
        ? `<section class="section"><h2>Projects</h2>
        ${projects.map((proj: any) => `
          <div class="entry">
            <div class="entry-header">
              <strong>${proj.name}</strong>
              ${proj.url ? `<a href="${proj.url}">${proj.url}</a>` : ''}
            </div>
            ${proj.description ? `<p>${proj.description}</p>` : ''}
            ${proj.technologies?.length ? `<div class="skills-grid">${proj.technologies.map((t: string) => `<span class="skill-tag">${t}</span>`).join('')}</div>` : ''}
          </div>`).join('')}
        </section>`
        : ''
    }

    ${
      certifications?.length
        ? `<section class="section"><h2>Certifications</h2>
        ${certifications.map((cert: any) => `
          <div class="entry">
            <div class="entry-header">
              <strong>${cert.name}</strong> — ${cert.issuer}
              <span class="date">${cert.date}</span>
            </div>
          </div>`).join('')}
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
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
      .date { font-size: 10pt; color: #666; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .skill-tag { padding: 2px 10px; border-radius: 12px; font-size: 10pt; }
      ul { margin-left: 18px; margin-top: 4px; }
      li { font-size: 10pt; margin-bottom: 2px; }
      p { font-size: 10pt; margin-top: 4px; }
      a { color: inherit; }
    `;

    const themes: Record<string, string> = {
      modern: `${base}
        .header { background: #1e40af; color: white; padding: 24px; border-radius: 4px; margin-bottom: 20px; }
        .header h1 { font-size: 22pt; font-weight: 700; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; opacity: 0.9; }
        .section h2 { color: #1e40af; }
        .skill-tag { background: #dbeafe; color: #1e40af; }`,
      classic: `${base}
        .header { border-bottom: 3px double #333; padding-bottom: 16px; margin-bottom: 20px; text-align: center; }
        .header h1 { font-size: 22pt; }
        .header .contact { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; }
        .section h2 { color: #333; text-transform: uppercase; letter-spacing: 1px; font-size: 11pt; }
        .skill-tag { background: #f3f4f6; color: #333; border: 1px solid #d1d5db; }`,
      minimal: `${base}
        .header { margin-bottom: 24px; }
        .header h1 { font-size: 24pt; font-weight: 300; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px; font-size: 10pt; color: #666; }
        .section h2 { color: #000; font-weight: 400; font-size: 12pt; letter-spacing: 2px; text-transform: uppercase; }
        .skill-tag { background: transparent; border: 1px solid #999; color: #555; }`,
      creative: `${base}
        .header { background: linear-gradient(135deg, #7c3aed, #db2777); color: white; padding: 28px; border-radius: 8px; margin-bottom: 24px; }
        .header h1 { font-size: 22pt; font-weight: 700; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; opacity: 0.85; }
        .section h2 { color: #7c3aed; }
        .skill-tag { background: #f3e8ff; color: #7c3aed; }`,
    };

    return themes[template] ?? themes['modern'];
  }
}
