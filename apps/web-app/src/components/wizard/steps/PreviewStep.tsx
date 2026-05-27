import { useEffect } from 'react';
import { useResumeStore } from '../../../store/resume.store';
import { ResumePreview } from '../../preview/ResumePreview';
import { pdfApi } from '../../../lib/api';
import { FONT_OPTIONS, getFontOption } from '../../../lib/fonts';
import type { ResumeFont } from '@resume-platform/shared-types';
import { useState } from 'react';

/** Inject a Google Fonts <link> into <head> if not already present */
function loadGoogleFont(url: string) {
  if (document.querySelector(`link[href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

const SANS_FONTS = FONT_OPTIONS.filter((f) => f.category === 'sans-serif');
const SERIF_FONTS = FONT_OPTIONS.filter((f) => f.category === 'serif');

export function PreviewStep() {
  const { resume, prevStep, resetResume, setFontFamily } = useResumeStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const selectedFont = getFontOption(resume.fontFamily);

  // Pre-load all Google Fonts so the picker renders them immediately
  useEffect(() => {
    FONT_OPTIONS.forEach((f) => loadGoogleFont(f.googleFontsUrl));
  }, []);

  const handleSelectFont = (id: ResumeFont) => {
    setFontFamily(id);
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const blob = await pdfApi.generate(resume);
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
          <h2 className="text-xl font-semibold text-gray-900">Preview &amp; Export</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Choose a font, review your resume, and download as PDF.
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

      {/* Font picker */}
      <div className="card print:hidden">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Choose a Font</h3>
        <div className="space-y-4">

          {/* Sans-serif row */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Sans-serif</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SANS_FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => handleSelectFont(font.id)}
                  className={`
                    relative flex flex-col items-start gap-0.5 px-3 py-3 rounded-lg border-2 text-left transition-all
                    ${selectedFont.id === font.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                  style={{ fontFamily: font.stack }}
                >
                  {selectedFont.id === font.id && (
                    <span className="absolute top-1.5 right-2 text-primary-600 text-xs">✓</span>
                  )}
                  <span className="text-base font-semibold text-gray-800">{font.name}</span>
                  <span className="text-xs text-gray-500">{font.sample}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Serif row */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Serif</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SERIF_FONTS.map((font) => (
                <button
                  key={font.id}
                  onClick={() => handleSelectFont(font.id)}
                  className={`
                    relative flex flex-col items-start gap-0.5 px-3 py-3 rounded-lg border-2 text-left transition-all
                    ${selectedFont.id === font.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                  style={{ fontFamily: font.stack }}
                >
                  {selectedFont.id === font.id && (
                    <span className="absolute top-1.5 right-2 text-primary-600 text-xs">✓</span>
                  )}
                  <span className="text-base font-semibold text-gray-800">{font.name}</span>
                  <span className="text-xs text-gray-500">{font.sample}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Resume preview */}
      <div className="card p-0 overflow-hidden">
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}
