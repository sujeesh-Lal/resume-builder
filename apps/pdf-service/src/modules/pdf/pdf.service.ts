import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
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
      // Use a wide enough viewport so text doesn't reflow compared to the preview
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      // Ensure all @font-face fonts are fully loaded before capturing (string form avoids TS dom-lib error)
      await page.evaluate('document.fonts.ready');

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

  // ─── Font lookup ──────────────────────────────────────────────────────────
  private static readonly FONTS: Record<string, { name: string; stack: string; pkg: string; weights: number[] }> = {
    'roboto':            { name: 'Roboto',            stack: "'Roboto', 'Segoe UI', Arial, sans-serif",              pkg: 'roboto',            weights: [300, 400, 700] },
    'lato':              { name: 'Lato',              stack: "'Lato', 'Helvetica Neue', Arial, sans-serif",           pkg: 'lato',              weights: [300, 400, 700] },
    'open-sans':         { name: 'Open Sans',         stack: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",      pkg: 'open-sans',         weights: [300, 400, 600, 700] },
    'raleway':           { name: 'Raleway',           stack: "'Raleway', 'Trebuchet MS', Arial, sans-serif",          pkg: 'raleway',           weights: [300, 400, 700] },
    'merriweather':      { name: 'Merriweather',      stack: "'Merriweather', Georgia, 'Times New Roman', serif",     pkg: 'merriweather',      weights: [300, 400, 700] },
    'playfair-display':  { name: 'Playfair Display',  stack: "'Playfair Display', Georgia, 'Times New Roman', serif", pkg: 'playfair-display',  weights: [400, 700] },
    'eb-garamond':       { name: 'EB Garamond',       stack: "'EB Garamond', Garamond, Georgia, serif",               pkg: 'eb-garamond',       weights: [400, 700] },
    'libre-baskerville': { name: 'Libre Baskerville', stack: "'Libre Baskerville', Baskerville, Georgia, serif",      pkg: 'libre-baskerville', weights: [400, 700] },
  };

  private getFontStack(fontId: string | undefined): string {
    return PdfService.FONTS[fontId ?? 'roboto']?.stack ?? PdfService.FONTS['roboto'].stack;
  }

  /** In-memory cache: fontId → embedded <style> block with base64 woff2 data */
  private readonly fontStyleCache = new Map<string, string>();

  /**
   * Build a <style> block with @font-face rules that embed the font's woff2
   * files as base64 data URIs — read from @fontsource/* packages installed in
   * node_modules.  No network access needed at PDF render time.
   * Returns empty string if the package isn't installed yet (run pnpm install).
   */
  private buildLocalFontStyle(fontId: string | undefined): string {
    const key = fontId ?? 'roboto';
    if (this.fontStyleCache.has(key)) return this.fontStyleCache.get(key)!;

    const fontConf = PdfService.FONTS[key] ?? PdfService.FONTS['roboto'];

    try {
      // Locate the @fontsource package directory
      const pkgJsonPath = require.resolve(`@fontsource/${fontConf.pkg}/package.json`);
      const pkgDir = path.dirname(pkgJsonPath);
      const filesDir = path.join(pkgDir, 'files');

      if (!fs.existsSync(filesDir)) {
        this.logger.warn(`@fontsource/${fontConf.pkg}/files not found — run pnpm install`);
        return '';
      }

      // Find all latin-normal woff2 files (skip latin-ext, cyrillic, greek, etc.)
      const woff2Files = fs.readdirSync(filesDir).filter(
        (f) => f.endsWith('-normal.woff2') &&
               f.includes('-latin-') &&
               !f.includes('-latin-ext'),
      );

      let css = '';
      for (const fileName of woff2Files) {
        const weightMatch = fileName.match(/-latin-(\d+)-normal\.woff2$/);
        if (!weightMatch) continue;
        const weight = parseInt(weightMatch[1], 10);
        if (!fontConf.weights.includes(weight)) continue;

        const b64 = fs.readFileSync(path.join(filesDir, fileName)).toString('base64');
        css += `@font-face{font-family:'${fontConf.name}';font-style:normal;font-weight:${weight};font-display:swap;src:url('data:font/woff2;base64,${b64}') format('woff2');}\n`;
      }

      if (!css) {
        this.logger.warn(`No woff2 files found for font ${key}`);
        return '';
      }

      const style = `<style>${css}</style>`;
      this.fontStyleCache.set(key, style);
      this.logger.info(`Font embedded from disk: ${key}`);
      return style;
    } catch (err) {
      this.logger.warn(`Font embed failed for ${key} — falling back to no custom font`, { err });
      return '';
    }
  }

  // ─── Elegant template ──────────────────────────────────────────────────────
  /** Normalise description: may be legacy string or new string[] */
  private toDescItems(d: string | string[] | undefined): string[] {
    if (!d) return [];
    if (Array.isArray(d)) return (d as string[]).filter(Boolean);
    return (d as string).trim() ? [(d as string).trim()] : [];
  }

  /** Escape user-supplied text so that < > & " ' don't break the HTML template */
  private e(text: string | undefined | null): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildElegantHtml(resume: ResumeData): string {
    const { personalInfo: p, summary, experience, education, skills, softSkills, languages, projects, certifications, customSections } = resume;

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
      const cells = list.map(s => `<td class="skill-cell">${this.e(s.name)}</td>`);
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
        <h2>${this.e(title)}</h2>
        <hr class="section-rule"/>
        ${body}
      </div>`;

    const experienceHtml = experience.length ? sectionHtml('Work Experience', experience.map(exp => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${this.e(exp.company)}${exp.position ? `<span class="sep"> // ${this.e(exp.position)} //</span>` : ''}
          </span>
          <span class="date">${this.e(exp.startDate)} – ${exp.current ? 'Present' : this.e(exp.endDate ?? '')}</span>
        </div>
        ${exp.location ? `<div class="entry-sub">${this.e(exp.location)}</div>` : ''}
        ${(() => {
          const bullets = [...this.toDescItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean);
          return bullets.length ? `<ul>${bullets.map((h: string) => `<li>${this.e(h)}</li>`).join('')}</ul>` : '';
        })()}
      </div>`).join('')) : '';

    const educationHtml = education.length ? sectionHtml('Education', education.map(edu => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${this.e(edu.degree)}${edu.field ? ` | ${this.e(edu.field)}` : ''}
            <span class="sep"> / ${this.e(edu.institution)} /</span>
          </span>
          <span class="date">${this.e(edu.startDate)} – ${edu.current ? 'Present' : this.e(edu.endDate ?? '')}</span>
        </div>
        ${edu.gpa ? `<div class="entry-sub">GPA: ${this.e(edu.gpa)}</div>` : ''}
        ${(() => {
          const bullets = [...this.toDescItems(edu.description), ...(edu.highlights ?? [])].filter(Boolean);
          return bullets.length ? `<ul>${bullets.map((h: string) => `<li>${this.e(h)}</li>`).join('')}</ul>` : '';
        })()}
      </div>`).join('')) : '';

    const proSkillsHtml = professionalSkills.length
      ? sectionHtml('Professional Skills', skillsGrid(professionalSkills)) : '';

    const techSkillsHtml = technicalSkills.length
      ? sectionHtml('Technical Skills', skillsGrid(technicalSkills)) : '';

    const certHtml = certifications.length ? sectionHtml('Professional Development', certifications.map(cert => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${this.e(cert.name)}${cert.issuer ? `<span class="sep"> // ${this.e(cert.issuer)}</span>` : ''}
          </span>
          <span class="date">${this.e(cert.date)}</span>
        </div>
      </div>`).join('')) : '';

    const projectsHtml = projects.length ? sectionHtml('Projects', projects.map(proj => `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">
            ${this.e(proj.name)}${proj.technologies?.length ? sep(proj.technologies.map(t => this.e(t)).join(', ')) : ''}
          </span>
          ${proj.startDate ? `<span class="date">${this.e(proj.startDate)}${proj.endDate ? ` – ${this.e(proj.endDate)}` : ''}</span>` : ''}
        </div>
        ${proj.description ? `<p>${this.e(proj.description)}</p>` : ''}
        ${proj.roles ? `<p><strong>Roles &amp; Responsibilities:</strong> ${this.e(proj.roles)}</p>` : ''}
        ${(proj.highlights ?? []).filter(Boolean).length ? `<ul>${(proj.highlights ?? []).filter(Boolean).map((h: string) => `<li>${this.e(h)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')) : '';

    const softSkillsHtml = (softSkills ?? []).length
      ? sectionHtml('Soft Skills', `
          <div class="soft-skills-row">
            ${(softSkills ?? []).map((sk: string) => `<span class="soft-skill">${this.e(sk)}</span>`).join('<span class="soft-sep"> · </span>')}
          </div>`) : '';

    const languagesHtml = (languages ?? []).length
      ? sectionHtml('Languages', `
          <table class="skills-table"><tbody><tr>
            ${(languages ?? []).map((l: any) =>
              `<td class="skill-cell"><strong>${this.e(l.name)}</strong>${l.proficiency ? `<span class="lang-prof"> · ${this.e(l.proficiency)}</span>` : ''}</td>`
            ).join('')}
          </tr></tbody></table>`) : '';

    const customHtml = (customSections ?? []).map((cs: any) => sectionHtml(cs.title,
      cs.items.map((item: any) => `
        <div class="entry">
          <div class="entry-header">
            <span class="entry-title">
              ${this.e(item.title)}${item.subtitle ? `<span class="sep"> // ${this.e(item.subtitle)}</span>` : ''}
            </span>
            ${item.date ? `<span class="date">${this.e(item.date)}</span>` : ''}
          </div>
          ${item.description ? `<p>${this.e(item.description)}</p>` : ''}
        </div>`).join('')
    )).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  ${this.buildLocalFontStyle(resume.fontFamily)}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${this.getFontStack(resume.fontFamily)};
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

    /* ── Soft Skills ── */
    .soft-skills-row { margin-top: 6px; font-family: Arial, sans-serif; font-size: 9pt; color: #222; }
    .soft-sep { color: #bbb; margin: 0 4px; }

    /* ── Languages ── */
    .lang-prof { color: #555; font-size: 8.5pt; font-weight: 400; }
  </style>
</head>
<body>
  <div class="resume">

    <div class="header">
      <div class="avatar">
        ${p.photo
          ? `<img src="${p.photo}" alt="${this.e(p.fullName)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;object-position:${p.photoPosition ? `${p.photoPosition.x}% ${p.photoPosition.y}%` : '50% 50%'};" />`
          : `<span>${initials}</span>`
        }
      </div>
      <div class="header-text">
        <h1>${this.e(p.fullName) || 'YOUR NAME'}</h1>
        ${p.professionalTitle ? `<div class="subtitle">${this.e(p.professionalTitle)}</div>` : ''}
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
        `<span>${this.e(item)}</span>${i < arr.length - 1 ? '<span class="divider">|</span>' : ''}`
      ).join('')}
    </div>

    ${summary ? sectionHtml('Summary', `<p style="margin-top:6px;font-size:9.5pt;line-height:1.6">${this.e(summary)}</p>`) : ''}
    ${experienceHtml}
    ${educationHtml}
    ${proSkillsHtml}
    ${techSkillsHtml}
    ${certHtml}
    ${softSkillsHtml}
    ${languagesHtml}
    ${projectsHtml}
    ${customHtml}

  </div>
</body>
</html>`;
  }

  // ─── Generic template (modern / classic / minimal / creative) ─────────────
  private buildGenericHtml(resume: ResumeData, template: string): string {
    const templateStyles = this.getTemplateStyles(template, resume.fontFamily);
    const { personalInfo, summary, experience, education, skills, softSkills, languages, projects, certifications } =
      resume;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  ${this.buildLocalFontStyle(resume.fontFamily)}
  <style>${templateStyles}</style>
</head>
<body>
  <div class="resume">
    <header class="header">
      <h1>${this.e(personalInfo.fullName)}</h1>
      ${personalInfo.professionalTitle ? `<div class="professional-title">${this.e(personalInfo.professionalTitle)}</div>` : ''}
      <div class="contact">
        ${personalInfo.email ? `<span>✉ ${this.e(personalInfo.email)}</span>` : ''}
        ${personalInfo.phone ? `<span>📞 ${this.e(personalInfo.phone)}</span>` : ''}
        ${personalInfo.location ? `<span>📍 ${this.e(personalInfo.location)}</span>` : ''}
        ${personalInfo.linkedin ? `<span>${this.e(personalInfo.linkedin)}</span>` : ''}
        ${personalInfo.github ? `<span>${this.e(personalInfo.github)}</span>` : ''}
        ${personalInfo.website ? `<span>${this.e(personalInfo.website)}</span>` : ''}
      </div>
    </header>

    ${summary ? `<section class="section"><h2>Summary</h2><p>${this.e(summary)}</p></section>` : ''}

    ${
      experience?.length
        ? `<section class="section"><h2>Experience</h2>
        ${experience.map((exp: any) => `
          <div class="entry">
            <div class="entry-header">
              <strong>${this.e(exp.position)}</strong> — ${this.e(exp.company)}${exp.location ? ` · ${this.e(exp.location)}` : ''}
              <span class="date">${this.e(exp.startDate)} – ${exp.current ? 'Present' : this.e(exp.endDate ?? '')}</span>
            </div>
            ${(() => {
              const bullets = [...this.toDescItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean);
              return bullets.length ? `<ul>${bullets.map((h: string) => `<li>${this.e(h)}</li>`).join('')}</ul>` : '';
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
              <strong>${this.e(edu.degree)} in ${this.e(edu.field)}</strong> — ${this.e(edu.institution)}
              <span class="date">${this.e(edu.startDate)} – ${edu.current ? 'Present' : this.e(edu.endDate ?? '')}</span>
            </div>
            ${edu.gpa ? `<p>GPA: ${this.e(edu.gpa)}</p>` : ''}
            ${(() => {
              const bullets = [...this.toDescItems(edu.description), ...(edu.highlights ?? [])].filter(Boolean);
              return bullets.length ? `<ul>${bullets.map((h: string) => `<li>${this.e(h)}</li>`).join('')}</ul>` : '';
            })()}
          </div>`).join('')}
        </section>`
        : ''
    }

    ${
      skills?.length
        ? `<section class="section"><h2>Skills</h2>
          <div class="skills-grid">
            ${skills.map((s: any) => `<span class="skill-tag">${this.e(s.name)}</span>`).join('')}
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
              <strong>${this.e(proj.name)}</strong>
              ${(proj.startDate || proj.endDate) ? `<span class="date">${this.e(proj.startDate ?? '')}${proj.endDate ? ` – ${this.e(proj.endDate)}` : ''}</span>` : ''}
              ${proj.url ? `<a href="${this.e(proj.url)}">${this.e(proj.url)}</a>` : ''}
            </div>
            ${proj.technologies?.length ? `<div class="skills-grid" style="margin-top:4px;">${proj.technologies.map((t: string) => `<span class="skill-tag">${this.e(t)}</span>`).join('')}</div>` : ''}
            ${proj.description ? `<p>${this.e(proj.description)}</p>` : ''}
            ${proj.roles ? `<p><strong>Roles &amp; Responsibilities:</strong> ${this.e(proj.roles)}</p>` : ''}
            ${(proj.highlights ?? []).length ? `<ul>${(proj.highlights ?? []).map((h: string) => `<li>${this.e(h)}</li>`).join('')}</ul>` : ''}
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
              <strong>${this.e(cert.name)}</strong> — ${this.e(cert.issuer)}
              <span class="date">${this.e(cert.date)}</span>
            </div>
          </div>`).join('')}
        </section>`
        : ''
    }

    ${
      (softSkills ?? []).length
        ? `<section class="section"><h2>Soft Skills</h2>
          <div class="skills-grid">
            ${(softSkills ?? []).map((s: string) => `<span class="skill-tag">${this.e(s)}</span>`).join('')}
          </div>
        </section>`
        : ''
    }

    ${
      (languages ?? []).length
        ? `<section class="section"><h2>Languages</h2>
          <div class="lang-list">
            ${(languages ?? []).map((l: any) =>
              `<span class="lang-item"><strong>${this.e(l.name)}</strong>${l.proficiency ? ` <span class="lang-prof">· ${this.e(l.proficiency)}</span>` : ''}</span>`
            ).join('')}
          </div>
        </section>`
        : ''
    }
  </div>
</body>
</html>`;
  }

  private getTemplateStyles(template: string, fontId?: string): string {
    const fontStack = this.getFontStack(fontId);
    const base = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: ${fontStack}; font-size: 11pt; color: #222; line-height: 1.5; }
      .resume { max-width: 800px; margin: 0 auto; padding: 20px; }
      .section { margin-bottom: 20px; }
      .section h2 { font-size: 14pt; border-bottom: 2px solid currentColor; padding-bottom: 4px; margin-bottom: 12px; }
      .entry { margin-bottom: 12px; }
      .entry-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; }
      .date { font-size: 10pt; color: #666; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .skill-tag { padding: 2px 10px; border-radius: 12px; font-size: 10pt; }
      .lang-list { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px; }
      .lang-item { font-size: 10pt; }
      .lang-prof { color: #666; font-size: 9pt; }
      ul { margin-left: 18px; margin-top: 4px; }
      li { font-size: 10pt; margin-bottom: 2px; }
      p { font-size: 10pt; margin-top: 4px; }
      a { color: inherit; }
    `;

    const themes: Record<string, string> = {
      modern: `${base}
        .header { background: #1e40af; color: white; padding: 24px; border-radius: 4px; margin-bottom: 20px; }
        .header h1 { font-size: 22pt; font-weight: 700; }
        .header .professional-title { font-size: 12pt; font-weight: 400; opacity: 0.85; margin-top: 4px; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; opacity: 0.9; }
        .section h2 { color: #1e40af; }
        .skill-tag { background: #dbeafe; color: #1e40af; }`,
      classic: `${base}
        .header { border-bottom: 3px double #333; padding-bottom: 16px; margin-bottom: 20px; text-align: center; }
        .header h1 { font-size: 22pt; }
        .header .professional-title { font-size: 12pt; color: #555; margin-top: 4px; letter-spacing: 0.5px; }
        .header .contact { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; }
        .section h2 { color: #333; text-transform: uppercase; letter-spacing: 1px; font-size: 11pt; }
        .skill-tag { background: #f3f4f6; color: #333; border: 1px solid #d1d5db; }`,
      minimal: `${base}
        .header { margin-bottom: 24px; }
        .header h1 { font-size: 24pt; font-weight: 300; }
        .header .professional-title { font-size: 12pt; color: #555; margin-top: 2px; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px; font-size: 10pt; color: #666; }
        .section h2 { color: #000; font-weight: 400; font-size: 12pt; letter-spacing: 2px; text-transform: uppercase; }
        .skill-tag { background: transparent; border: 1px solid #999; color: #555; }`,
      creative: `${base}
        .header { background: linear-gradient(135deg, #7c3aed, #db2777); color: white; padding: 28px; border-radius: 8px; margin-bottom: 24px; }
        .header h1 { font-size: 22pt; font-weight: 700; }
        .header .professional-title { font-size: 12pt; font-weight: 400; opacity: 0.9; margin-top: 4px; }
        .header .contact { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; font-size: 10pt; opacity: 0.85; }
        .section h2 { color: #7c3aed; }
        .skill-tag { background: #f3e8ff; color: #7c3aed; }`,
    };

    return themes[template] ?? themes['modern'];
  }
}
