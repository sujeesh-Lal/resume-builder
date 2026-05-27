import type { ResumeData } from '@resume-platform/shared-types';

interface Props { resume: ResumeData }

// Backward-compat: description may still be a plain string in old stored data
function descItems(d: string | string[] | undefined): string[] {
  if (!d) return [];
  if (Array.isArray(d)) return d.filter(Boolean);
  return d.trim() ? [d.trim()] : [];
}

export function ModernTemplate({ resume }: Props) {
  const { personalInfo: p, summary, experience, education, skills, projects, certifications } = resume;

  return (
    <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '11pt', color: '#222', lineHeight: '1.5' }}>
      {/* Header */}
      <div style={{ background: '#1e40af', color: 'white', padding: '28px 32px' }}>
        <h1 style={{ margin: 0, fontSize: '24pt', fontWeight: 700 }}>{p.fullName || 'Your Name'}</h1>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '10pt', opacity: 0.9 }}>
          {p.email && <span>✉ {p.email}</span>}
          {p.phone && <span>📞 {p.phone}</span>}
          {p.location && <span>📍 {p.location}</span>}
          {p.linkedin && <span>in {p.linkedin}</span>}
          {p.github && <span>⌥ {p.github}</span>}
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {summary && (
          <Section title="Summary" color="#1e40af">
            <p style={{ margin: 0 }}>{summary}</p>
          </Section>
        )}

        {experience.length > 0 && (
          <Section title="Experience" color="#1e40af">
            {experience.map((exp) => (
              <Entry
                key={exp.id}
                title={exp.position}
                subtitle={`${exp.company}${exp.location ? ` · ${exp.location}` : ''}`}
                date={`${exp.startDate} – ${exp.current ? 'Present' : exp.endDate ?? ''}`}
                description={descItems(exp.description)}
                highlights={exp.highlights}
              />
            ))}
          </Section>
        )}

        {education.length > 0 && (
          <Section title="Education" color="#1e40af">
            {education.map((edu) => (
              <Entry
                key={edu.id}
                title={`${edu.degree} in ${edu.field}`}
                subtitle={edu.institution}
                date={`${edu.startDate} – ${edu.current ? 'Present' : edu.endDate ?? ''}`}
                description={edu.gpa ? `GPA: ${edu.gpa}` : undefined}
                highlights={edu.highlights}
              />
            ))}
          </Section>
        )}

        {skills.length > 0 && (
          <Section title="Skills" color="#1e40af">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map((sk) => (
                <span key={sk.id} style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: '12px', fontSize: '10pt' }}>
                  {sk.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {projects.length > 0 && (
          <Section title="Projects" color="#1e40af">
            {projects.map((proj) => (
              <Entry
                key={proj.id}
                title={proj.name}
                subtitle={proj.technologies.join(', ')}
                description={proj.description}
                highlights={proj.highlights}
              />
            ))}
          </Section>
        )}

        {certifications.length > 0 && (
          <Section title="Certifications" color="#1e40af">
            {certifications.map((cert) => (
              <Entry
                key={cert.id}
                title={cert.name}
                subtitle={cert.issuer}
                date={cert.date}
              />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '13pt', color, borderBottom: `2px solid ${color}`, paddingBottom: '4px', marginBottom: '12px', marginTop: 0 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Entry({ title, subtitle, date, description, highlights }: {
  title: string; subtitle?: string; date?: string; description?: string[]; highlights?: string[];
}) {
  const allBullets = [...(description ?? []), ...(highlights ?? [])].filter(Boolean);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <strong>{title}</strong>
        {date && <span style={{ fontSize: '10pt', color: '#666' }}>{date}</span>}
      </div>
      {subtitle && <div style={{ color: '#555', fontSize: '10pt' }}>{subtitle}</div>}
      {allBullets.length > 0 && (
        <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
          {allBullets.map((h, i) => <li key={i} style={{ fontSize: '10pt' }}>{h}</li>)}
        </ul>
      )}
    </div>
  );
}
