import type { ResumeFont } from '@resume-platform/shared-types';

export interface FontOption {
  id: ResumeFont;
  name: string;
  /** CSS font-family stack (loaded font first, then fallbacks) */
  stack: string;
  /** Google Fonts embed URL */
  googleFontsUrl: string;
  category: 'sans-serif' | 'serif';
  /** A short sample phrase rendered in this font for the picker */
  sample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // ── Sans-serif ────────────────────────────────────────────────────────────
  {
    id: 'roboto',
    name: 'Roboto',
    stack: "'Roboto', 'Segoe UI', Arial, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    category: 'sans-serif',
    sample: 'Clean & Modern',
  },
  {
    id: 'lato',
    name: 'Lato',
    stack: "'Lato', 'Helvetica Neue', Arial, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
    category: 'sans-serif',
    sample: 'Professional & Friendly',
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    stack: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
    category: 'sans-serif',
    sample: 'Neutral & Readable',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    stack: "'Raleway', 'Trebuchet MS', Arial, sans-serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;700&display=swap',
    category: 'sans-serif',
    sample: 'Elegant & Distinctive',
  },

  // ── Serif ────────────────────────────────────────────────────────────────
  {
    id: 'merriweather',
    name: 'Merriweather',
    stack: "'Merriweather', Georgia, 'Times New Roman', serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap',
    category: 'serif',
    sample: 'Classic & Authoritative',
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    stack: "'Playfair Display', Georgia, 'Times New Roman', serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&display=swap',
    category: 'serif',
    sample: 'Sophisticated & Bold',
  },
  {
    id: 'eb-garamond',
    name: 'EB Garamond',
    stack: "'EB Garamond', Garamond, Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;700&display=swap',
    category: 'serif',
    sample: 'Timeless & Literary',
  },
  {
    id: 'libre-baskerville',
    name: 'Libre Baskerville',
    stack: "'Libre Baskerville', Baskerville, Georgia, serif",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&display=swap',
    category: 'serif',
    sample: 'Traditional & Formal',
  },
];

export const DEFAULT_FONT_ID: ResumeFont = 'roboto';

export function getFontOption(id: ResumeFont | undefined): FontOption {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}

/** All Google Fonts URLs for a given font (just the one URL for now) */
export function getGoogleFontsUrl(id: ResumeFont | undefined): string {
  return getFontOption(id).googleFontsUrl;
}
