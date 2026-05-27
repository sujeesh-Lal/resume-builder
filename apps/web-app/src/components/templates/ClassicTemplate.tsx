import type { ResumeData } from '@resume-platform/shared-types';

interface Props { resume: ResumeData }

function descItems(d: string | string[] | undefined): string[] {
  if (!d) return [];
  if (Array.isArray(d)) return d.filter(Boolean);
  return d.trim() ? [d.trim()] : [];
}

export function ClassicTemplate({ resume }: Props) {
  const { personalInfo: p, summary, experience, education, skills, softSkills, languages, projects, certifications } = resume;

  return (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '11pt', color: '#111', lineHeight: '1.6', padding: '32px' }}>
      {/* Header - centered */}
      <div style={{ textAlign: 'center', borderBottom: '3px double #333', paddingBottom: '16px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22pt', letterSpacing: '1px' }}>{p.fullName || 'Your Name'}</h1>
        {p.professionalTitle && (
          <div style={{ fontSize: '12pt', color: '#555', marginTop: '4px', letterSpacing: '0.5px' }}>{p.professionalTitle}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '10pt', color: '#444' }}>
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
        </div>
      </div>

      {summary && (
        <Section title="Professional Summary">
          <p style={{ margin: 0, fontStyle: 'italic' }}>{summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Work Experience">
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.position}</strong>
                <span style={{ fontSize: '10pt', color: '#555' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate ?? ''}</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#555' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
              {[...descItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {[...descItems(exp.description), ...(exp.highlights ?? [])].filter(Boolean).map((h, i) => (
                    <li key={i} style={{ fontSize: '10pt' }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{edu.degree} in {edu.field}</strong>
                <span style={{ fontSize: '10pt', color: '#555' }}>{edu.startDate} – {edu.current ? 'Present' : edu.endDate ?? ''}</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#555' }}>{edu.institution}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</div>
              {[...descItems(edu.description), ...(edu.highlights ?? [])].filter(Boolean).length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {[...descItems(edu.description), ...(edu.highlights ?? [])].filter(Boolean).map((h, i) => (
                    <li key={i} style={{ fontSize: '10pt' }}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p style={{ margin: 0 }}>{skills.map((s) => s.name).join(' · ')}</p>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '10px' }}>
              <strong>{proj.name}</strong>
              {proj.technologies.length > 0 && <span style={{ fontSize: '10pt', color: '#555' }}> — {proj.technologies.join(', ')}</span>}
              {proj.description && <p style={{ margin: '4px 0 0', fontSize: '10pt' }}>{proj.description}</p>}
              {proj.roles && (
                <p style={{ margin: '4px 0 0', fontSize: '10pt' }}>
                  <strong>Roles &amp; Responsibilities:</strong> {proj.roles}
                </p>
              )}
              {proj.highlights?.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
                  {proj.highlights.map((h, i) => <li key={i} style={{ fontSize: '10pt' }}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          {certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span><strong>{cert.name}</strong> — {cert.issuer}</span>
              <span style={{ fontSize: '10pt', color: '#555' }}>{cert.date}</span>
            </div>
          ))}
        </Section>
      )}

      {(softSkills ?? []).length > 0 && (
        <Section title="Soft Skills">
          <p style={{ margin: 0 }}>{(softSkills ?? []).join(' · ')}</p>
        </Section>
      )}

      {(languages ?? []).length > 0 && (
        <Section title="Languages">
          <p style={{ margin: 0 }}>
            {(languages ?? []).map((l) => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(' · ')}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <h2 style={{ fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #999', paddingBottom: '2px', marginBottom: '10px', marginTop: 0 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
