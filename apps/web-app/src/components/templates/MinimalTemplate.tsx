import type { ResumeData } from '@resume-platform/shared-types';

interface Props { resume: ResumeData }

export function MinimalTemplate({ resume }: Props) {
  const { personalInfo: p, summary, experience, education, skills, projects, certifications } = resume;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11pt', color: '#333', lineHeight: '1.6', padding: '40px 48px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '26pt', fontWeight: 300, color: '#111' }}>{p.fullName || 'Your Name'}</h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '6px', fontSize: '10pt', color: '#777' }}>
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.website && <span>{p.website}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
          {p.github && <span>{p.github}</span>}
        </div>
      </div>

      {summary && (
        <Section title="About">
          <p style={{ margin: 0, color: '#555' }}>{summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((exp) => (
            <div key={exp.id} style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
              <div style={{ fontSize: '10pt', color: '#888', paddingTop: '1px' }}>
                {exp.startDate}<br />–<br />{exp.current ? 'Present' : exp.endDate ?? ''}
              </div>
              <div>
                <strong>{exp.position}</strong> <span style={{ color: '#888' }}>at</span> {exp.company}
                {exp.location && <span style={{ color: '#aaa', fontSize: '10pt' }}> · {exp.location}</span>}
                {exp.description && <p style={{ margin: '4px 0 0', fontSize: '10pt', color: '#555' }}>{exp.description}</p>}
                {exp.highlights?.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: '16px', color: '#555' }}>
                    {exp.highlights.map((h, i) => <li key={i} style={{ fontSize: '10pt' }}>{h}</li>)}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
              <div style={{ fontSize: '10pt', color: '#888' }}>{edu.startDate}<br />–<br />{edu.current ? 'Present' : edu.endDate ?? ''}</div>
              <div>
                <strong>{edu.degree} in {edu.field}</strong><br />
                <span style={{ color: '#666', fontSize: '10pt' }}>{edu.institution}{edu.gpa ? ` · ${edu.gpa}` : ''}</span>
              </div>
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skills.map((sk) => (
              <span key={sk.id} style={{ border: '1px solid #ccc', color: '#555', padding: '2px 10px', borderRadius: '4px', fontSize: '10pt' }}>
                {sk.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((proj) => (
            <div key={proj.id} style={{ marginBottom: '10px' }}>
              <strong>{proj.name}</strong>
              {proj.technologies.length > 0 && <span style={{ fontSize: '10pt', color: '#888' }}> — {proj.technologies.join(', ')}</span>}
              {proj.description && <p style={{ margin: '4px 0 0', fontSize: '10pt', color: '#555' }}>{proj.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          {certifications.map((cert) => (
            <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '10pt' }}>
              <span><strong>{cert.name}</strong> · {cert.issuer}</span>
              <span style={{ color: '#888' }}>{cert.date}</span>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '3px', color: '#999', marginBottom: '12px', marginTop: 0 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
