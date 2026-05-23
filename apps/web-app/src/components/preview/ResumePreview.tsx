import type { ResumeData } from '@resume-platform/shared-types';
import { ModernTemplate } from '../templates/ModernTemplate';
import { ClassicTemplate } from '../templates/ClassicTemplate';
import { MinimalTemplate } from '../templates/MinimalTemplate';
import { CreativeTemplate } from '../templates/CreativeTemplate';

interface Props {
  resume: ResumeData;
}

export function ResumePreview({ resume }: Props) {
  const templates = {
    modern: <ModernTemplate resume={resume} />,
    classic: <ClassicTemplate resume={resume} />,
    minimal: <MinimalTemplate resume={resume} />,
    creative: <CreativeTemplate resume={resume} />,
  };

  return (
    <div className="bg-white shadow-inner">
      <div
        className="mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxWidth: '100%',
          padding: '0',
          boxSizing: 'border-box',
        }}
      >
        {templates[resume.template] ?? templates['modern']}
      </div>
    </div>
  );
}
