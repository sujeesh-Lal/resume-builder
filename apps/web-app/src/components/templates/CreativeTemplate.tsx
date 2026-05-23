import type { ResumeData } from '@resume-platform/shared-types';

interface Props { resume: ResumeData }

export function CreativeTemplate({ resume }: Props) {
  const { personalInfo: p, summary, experience, education, skills, projects, certifications } = resume;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11pt', color: '#222', lineHeight: '1.5' }}>
      {/* Gradient header */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', color: 'white', padding: '36px 32px', borderRadius: '0 0 12px 12px' }}>
        <h1 style={{ margin: 0, fontSize: '26pt', fontWeight: 700, letterSpacing: '-0.5px' }}>{p.fullName || 'Your Name'}</h1>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px', fontSize: '10pt', opacity: 0.85 }}>
          {p.email && <span>✉ {p.email}</span>}
          {p.phone && <span>📱 {p.phone}</span>}
          {p.location && <span>📍 {p.location}</span>}
          {p.linkedin && <span>🔗 {p.linkedin}</span>}
          {p.github && <span>⌥ {p.github}</span>}
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {summary && (
          <Section title="About Me" color="#7c3aed">
            <p style={{ margin: 0 }}>{summary}</p>
          </Section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px' }}>
          {/* Main column */}
          <div>
            {experience.length > 0 && (
              <Section title="Experience" color="#7c3aed">
                {experience.map((exp) => (
                  <div key={exp.id} style={{ marginBottom: '14px', borderLeft: '3px solid #e9d5ff', paddingLeft: '12px' }}>
                    <strong>{exp.position}</strong>
                    <div style={{ color: '#7c3aed', fontSize: '10pt' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>
                    <div style={{ fontSize: '10pt', color: '#888', marginBottom: '4px' }}>{exp.startDate} – {exp.current ? 'Present' : exp.endDate ?? ''}</div>
                    {exp.description && <p style={{ margin: 0, fontSize: '10pt' }}>{exp.description}</p>}
                    {exp.highlights?.length > 0 && (
                      <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                        {exp.highlights.map((h, i) => <li key={i} style={{ fontSize: '10pt' }}>{h}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {projects.length > 0 && (
              <Section title="Projects" color="#7c3aed">
                {projects.map((proj) => (
                  <div key={proj.id} style={{ marginBottom: '12px', borderLeft: '3px solid #fce7f3', paddingLeft: '12px' }}>
                    <strong>{proj.name}</strong>
                    {proj.description && <p style={{ margin: '2px 0 0', fontSize: '10pt' }}>{proj.description}</p>}
                    {proj.technologies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {proj.technologies.map((t) => (
                          <span key={t} style={{ background: '#f3e8ff', color: '#7c3aed', padding: '1px 8px', borderRadius: '10px', fontSize: '9pt' }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {skills.length > 0 && (
              <Section title="Skills" color="#db2777">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {skills.map((sk) => (
                    <span key={sk.id} style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', color: '#6b21a8', padding: '3px 10px', borderRadius: '6px', fontSize: '10pt' }}>
                      {sk.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {education.length > 0 && (
              <Section title="Education" color="#db2777">
                {education.map((edu) => (
                  <div key={edu.id} style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '10pt' }}>{edu.degree}</strong><br />
                    <span style={{ fontSize: '10pt', color: '#555' }}>{edu.field}</span><br />
                    <span style={{ fontSize: '10pt', color: '#db2777' }}>{edu.institution}</span><br />
                    <span style={{ fontSize: '9pt', color: '#888' }}>{edu.startDate} – {edu.current ? 'Present' : edu.endDate ?? ''}</span>
                  </div>
                ))}
              </Section>
            )}

            {certifications.length > 0 && (
              <Section title="Certifications" color="#db2777">
                {certifications.map((cert) => (
                  <div key={cert.id} style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '10pt' }}>{cert.name}</strong><br />
                    <span style={{ fontSize: '10pt', color: '#555' }}>{cert.issuer}</span><br />
                    <span style={{ fontSize: '9pt', color: '#888' }}>{cert.date}</span>
                  </div>
                ))}
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '12pt', color, borderBottom: `2px solid ${color}`, paddingBottom: '4px', marginBottom: '10px', marginTop: 0 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
