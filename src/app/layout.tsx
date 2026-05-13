import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'DeepLead — CRM Inteligente', template: '%s | DeepLead' },
  description: 'Plataforma CRM com IA integrada para gestão de leads, campanhas e equipes. Transforme seus leads em negócios fechados.',
  keywords: ['CRM', 'leads', 'imobiliária', 'IA', 'inteligência artificial', 'vendas'],
  authors: [{ name: 'DeepLead' }],
  robots: 'noindex,nofollow',
  openGraph: {
    title: 'DeepLead — CRM Inteligente',
    description: 'Plataforma CRM com IA integrada',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
