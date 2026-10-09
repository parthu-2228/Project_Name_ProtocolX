import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'What Did I Miss? — Local-First AI Catch-Up Micro-App',
  description:
    'Catch up on overwhelming chat conversations with 100% on-device AI. Summarize unread messages, extract decisions, action items, and deadlines without data leaving your device.',
  keywords: ['chat summary', 'local AI', 'Ollama', 'IndexedDB', 'privacy-first', 'WhatsApp catchup', 'hackathon'],
  authors: [{ name: 'What Did I Miss Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
