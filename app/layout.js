import { Geist, Geist_Mono, JetBrains_Mono, Architects_Daughter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/context';

const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'greek'],
  weight: ['400', '500', '600'],
  variable: '--font-jbm',
  display: 'swap',
});

const architectsDaughter = Architects_Daughter({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-note-src',
  display: 'swap',
});

export const metadata = {
  title: 'PromptSketch — Educational Prompt A/B & Learning Analytics Platform',
  description: 'Rigorous open-source platform for educational prompt experimentation and Learning Analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geist.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${architectsDaughter.variable}`}
    >
      <body className="min-h-screen bg-blueprint-grid text-ink font-body">
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <LanguageProvider>
          <main id="main-content" tabIndex={-1} className="w-full">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
