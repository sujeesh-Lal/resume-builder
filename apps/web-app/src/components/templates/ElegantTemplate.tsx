import type { ResumeData, Skill } from '@resume-platform/shared-types';
import { getFontOption } from '../../lib/fonts';

interface Props { resume: ResumeData }

function descItems(d: string | string[] | undefined): string[] {
  if (!d) return [];
  if (Array.isArray(d)) return d.filter(Boolean);
  return d.trim() ? [d.trim()] : [];
}

// ─── Styling constants ────────────────────────────────────────────────────────
const FONT_DEFAULT = "'Georgia', 'Times New Roman', serif";
const SANS = "'Arial', 'Helvetica Neue', sans-serif";
const COLOR_TEXT = '#222222';
const COLOR_MUTED = '#555555';
const COLOR_DIVIDER = '#cccccc';
const SECTION_LETTER_SPACING = '0.18em';

// ─── Helper: spaced-caps section heading ─────────────────────────────────────
function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <h2 style={{
        fontFamily: SANS,
        fontSize: '9pt',
        fontWeight: 600,
        letterSpacing: SECTION_LETTER_SPACING,
        textTransform: 'uppercase',
        color: COLOR_TEXT,
        margin: '0 0 6px 0',
      }}>
        {title}
      </h2>
      <hr style={{ border: 'none', borderTop: `1px solid ${COLOR_DIVIDER}`, margin: 0 }} />
    </div>
  );
}

// ─── Skills column layout ─────────────────────────────────────────────────────
function SkillsGrid({ skills }: { skills: Skill[] }) {
  const cols = 4;
  const rows: Skill[][] = [];
  for (let i = 0; i < skills.length; i += cols) {
    rows.push(skills.slice(i, i + cols));
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri}>
            {row.map((sk, ci) => (
              <td key={ci} style={{
                fontFamily: SANS,
                fontSize: '9.5pt',
                color: COLOR_TEXT,
                paddingBottom: '4px',
                width: '25%',
              }}>
                {sk.name}
              </td>
            ))}
            {/* Pad empty cells */}
            {Array.from({ length: cols - row.length }).map((_, ci) => (
              <td key={`pad-${ci}`} style={{ width: '25%' }} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main template ────────────────────────────────────────────────────────────
export function ElegantTemplate({ resume }: Props) {
  const { personalInfo: p, summary, experience, education, skills, softSkills, languages, projects, certifications, customSections } = resume;
  const FONT = getFontOption(resume.fontFamily).stack ?? FONT_DEFAULT;

  // Split skills by category if provided, otherwise treat all as "Professional Skills"
  const professionalSkills = skills.filter(sk => !sk.category || sk.category.toLowerCase() !== 'technical');
  const technicalSkills = skills.filter(sk => sk.category?.toLowerCase() === 'technical');

  // Initials for photo placeholder
  const initials = (p.fullName || 'YN')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div style={{
      fontFamily: FONT,
      fontSize: '10pt',
      color: COLOR_TEXT,
      lineHeight: '1.55',
      background: '#fff',
      padding: '36px 40px',
      boxSizing: 'border-box',
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
        {/* Circular photo / initials */}
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: '#e8e8e8',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: '1px solid #d0d0d0',
        }}>
          {p.photo ? (
            <img
              src={p.photo}
              alt={p.fullName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: p.photoPosition
                  ? `${p.photoPosition.x}% ${p.photoPosition.y}%`
                  : '50% 50%',
              }}
            />
          ) : (
            <span style={{
              fontFamily: SANS,
              fontSize: '22pt',
              fontWeight: 300,
              color: '#888',
              letterSpacing: '0.05em',
            }}>
              {initials}
            </span>
          )}
        </div>

        {/* Name + title */}
        <div>
          <h1 style={{
            fontFamily: SANS,
            fontSize: '22pt',
            fontWeight: 400,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            margin: 0,
            lineHeight: 1.1,
          }}>
            {p.fullName || 'YOUR NAME'}
          </h1>
          {(p.professionalTitle) && (
            <p style={{
              fontFamily: SANS,
              fontSize: '9pt',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: COLOR_MUTED,
              margin: '6px 0 0 0',
            }}>
              {p.professionalTitle}
            </p>
          )}
        </div>
      </div>

      {/* ── CONTACT BAR ── */}
      <hr style={{ border: 'none', borderTop: `1px solid ${COLOR_DIVIDER}`, marginBottom: '8px' }} />
      <div style={{
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        fontFamily: SANS,
        fontSize: '8.5pt',
        color: COLOR_MUTED,
        alignItems: 'center',
        marginBottom: '18px',
      }}>
        {p.phone && <><span>{p.phone}</span><span style={{ margin: '0 6px', color: COLOR_DIVIDER }}>|</span></>}
        {p.email && <><span>{p.email}</span><span style={{ margin: '0 6px', color: COLOR_DIVIDER }}>|</span></>}
        {p.linkedin && <><span>{p.linkedin}</span><span style={{ margin: '0 6px', color: COLOR_DIVIDER }}>|</span></>}
        {p.location && <span>{p.location}</span>}
        {p.website && <><span style={{ margin: '0 6px', color: COLOR_DIVIDER }}>|</span><span>{p.website}</span></>}
      </div>

      {/* ── SUMMARY ── */}
      {summary && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Summary" />
          <p style={{ fontFamily: FONT, fontSize: '9.5pt', color: COLOR_TEXT, margin: '8px 0 0', lineHeight: '1.6' }}>
            {summary}
          </p>
        </div>
      )}

      {/* ── WORK EXPERIENCE ── */}
      {experience.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Work Experience" />
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '14px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontFamily: SANS, fontSize: '9.5pt', fontWeight: 700 }}>
                  {exp.company}
                  {exp.position && (
                    <span style={{ fontWeight: 400, color: COLOR_MUTED }}>
                      {' '}// {exp.position} //
                    </span>
                  )}
                </span>
                <span style={{ fontFamily: SANS, fontSize: '9pt', color: COLOR_MUTED }}>
                  {exp.startDate} – {exp.current ? 'Present' : (exp.endDate ?? '')}
                </span>
              </div>
              {exp.location && (
                <div style={{ fontFamily: SANS, fontSize: '8.5pt', color: COLOR_MUTED }}>{exp.location}</div>
              )}
              {[...descItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {[...descItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean).map((h, i) => (
                    <li key={i} style={{ fontSize: '9.5pt', color: COLOR_TEXT, marginBottom: '2px' }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── EDUCATION ── */}
      {education.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Education" />
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontFamily: SANS, fontSize: '9.5pt', fontWeight: 700 }}>
                  {edu.degree}
                  {edu.field && <span style={{ fontWeight: 700 }}> | {edu.field}</span>}
                  {' '}
                  <span style={{ fontWeight: 400 }}>/ {edu.institution} /</span>
                </span>
                <span style={{ fontFamily: SANS, fontSize: '9pt', color: COLOR_MUTED }}>
                  {edu.startDate} – {edu.current ? 'Present' : (edu.endDate ?? '')}
                </span>
              </div>
              {edu.gpa && (
                <div style={{ fontFamily: SANS, fontSize: '9pt', color: COLOR_MUTED }}>GPA: {edu.gpa}</div>
              )}
              {[...descItems(edu.description), ...(edu.highlights ?? [])].filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {[...descItems(edu.description), ...(edu.highlights ?? [])].filter(Boolean).map((h, i) => (
                    <li key={i} style={{ fontSize: '9.5pt', color: COLOR_TEXT }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PROFESSIONAL SKILLS ── */}
      {professionalSkills.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Professional Skills" />
          <div style={{ marginTop: '8px' }}>
            <SkillsGrid skills={professionalSkills} />
          </div>
        </div>
      )}

      {/* ── TECHNICAL SKILLS ── */}
      {technicalSkills.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Technical Skills" />
          <div style={{ marginTop: '8px' }}>
            <SkillsGrid skills={technicalSkills} />
          </div>
        </div>
      )}

      {/* ── PROFESSIONAL DEVELOPMENT (Certifications) ── */}
      {certifications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Professional Development" />
          {certifications.map((cert) => (
            <div key={cert.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              marginBottom: '6px',
            }}>
              <span style={{ fontFamily: SANS, fontSize: '9.5pt', fontWeight: 700 }}>
                {cert.name}
                {cert.issuer && (
                  <span style={{ fontWeight: 400, color: COLOR_MUTED }}> // {cert.issuer}</span>
                )}
              </span>
              <span style={{ fontFamily: SANS, fontSize: '9pt', color: COLOR_MUTED }}>{cert.date}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── PROJECTS ── */}
      {projects.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Projects" />
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontFamily: SANS, fontSize: '9.5pt', fontWeight: 700 }}>
                  {proj.name}
                  {proj.technologies.length > 0 && (
                    <span style={{ fontWeight: 400, color: COLOR_MUTED }}> // {proj.technologies.join(', ')} //</span>
                  )}
                </span>
                {(proj.startDate || proj.endDate) && (
                  <span style={{ fontFamily: SANS, fontSize: '9pt', color: COLOR_MUTED }}>
                    {proj.startDate}{proj.endDate ? ` – ${proj.endDate}` : ''}
                  </span>
                )}
              </div>
              {proj.description && (
                <p style={{ margin: '4px 0 0', fontSize: '9.5pt', color: COLOR_TEXT }}>{proj.description}</p>
              )}
              {proj.roles && (
                <p style={{ margin: '4px 0 0', fontSize: '9.5pt', color: COLOR_TEXT }}>
                  <strong style={{ fontFamily: SANS }}>Roles &amp; Responsibilities:</strong> {proj.roles}
                </p>
              )}
              {proj.highlights.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {proj.highlights.map((h, i) => (
                    <li key={i} style={{ fontSize: '9.5pt', color: COLOR_TEXT }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SOFT SKILLS ── */}
      {(softSkills ?? []).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Soft Skills" />
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(softSkills ?? []).map((sk) => (
              <span key={sk} style={{ fontFamily: SANS, fontSize: '9.5pt', color: COLOR_TEXT }}>
                {sk}
              </span>
            )).reduce<React.ReactNode[]>((acc, el, i, arr) =>
              i < arr.length - 1 ? [...acc, el, <span key={`sep-${i}`} style={{ color: COLOR_DIVIDER }}>·</span>] : [...acc, el],
              []
            )}
          </div>
        </div>
      )}

      {/* ── LANGUAGES ── */}
      {(languages ?? []).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionHeading title="Languages" />
          <div style={{ marginTop: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  {(languages ?? []).map((lang) => (
                    <td key={lang.id} style={{ fontFamily: SANS, fontSize: '9.5pt', color: COLOR_TEXT, paddingBottom: '4px', width: `${100 / Math.min((languages ?? []).length, 4)}%` }}>
                      <strong>{lang.name}</strong>
                      {lang.proficiency && <span style={{ color: COLOR_MUTED, fontSize: '9pt' }}> · {lang.proficiency}</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CUSTOM SECTIONS (e.g. Volunteer Experience) ── */}
      {customSections.map((section) => (
        <div key={section.id} style={{ marginBottom: '20px' }}>
          <SectionHeading title={section.title} />
          {section.items.map((item) => (
            <div key={item.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              marginBottom: '6px',
            }}>
              <span style={{ fontFamily: SANS, fontSize: '9.5pt', fontWeight: 700 }}>
                {item.title}
                {item.subtitle && (
                  <span style={{ fontWeight: 400, color: COLOR_MUTED }}> // {item.subtitle}</span>
                )}
              </span>
              {item.date && (
                <span style={{ fontFamily: SANS, fontSize: '9pt', color: COLOR_MUTED }}>{item.date}</span>
              )}
              {item.description && (
                <p style={{ margin: '2px 0 0', fontSize: '9.5pt', color: COLOR_TEXT, width: '100%' }}>
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ))}

    </div>
  );
}
