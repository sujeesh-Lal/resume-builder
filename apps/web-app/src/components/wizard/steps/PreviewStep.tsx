import { useState } from 'react';
import { useResumeStore } from '../../../store/resume.store';
import { ResumePreview } from '../../preview/ResumePreview';
import { pdfApi } from '../../../lib/api';

export function PreviewStep() {
  const { resume, prevStep, resetResume } = useResumeStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const blob = await pdfApi.generate(resume.id, resume.template);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.personalInfo.fullName || 'resume'}-resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError('PDF generation requires the backend to be running. See README for setup.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="card flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Preview & Export</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Review your resume and download as PDF.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={prevStep} className="btn-secondary">← Back</button>
          <button onClick={handlePrint} className="btn-secondary print:hidden">
            🖨️ Print
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="btn-primary print:hidden"
          >
            {isDownloading ? 'Generating…' : '⬇ Download PDF'}
          </button>
          <button
            onClick={resetResume}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors print:hidden"
          >
            Start Over
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-4 py-3 rounded-lg">
          ⚠️ {downloadError}
        </div>
      )}

      {/* Resume preview */}
      <div className="card p-0 overflow-hidden">
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}
