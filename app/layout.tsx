import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from '@/components/ui/toaster';

// const _geist = Geist({ subsets: ["latin"] });
// const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.denbegnayeaiagent.com'),
  title: 'Denbegnaye - Build AI Agents Without Limits',
  description:
    'Denbegnaye is a visual AI agent builder for no-code workflow automation, with Office Intelligence tools for analyzing documents and business data.',
  keywords: [
    'Denbegnaye',
    'AI agent builder',
    'workflow automation',
    'Office Intelligence',
    'document analysis',
    'data analysis',
    'no-code AI',
  ],
  authors: [{ name: 'Denbegnaye Team' }],
  openGraph: {
    title: 'Denbegnaye - Build AI Agents Without Limits',
    description:
      'Denbegnaye is a visual AI agent builder for no-code workflow automation, with Office Intelligence tools for analyzing documents and business data.',
    url: 'https://www.denbegnayeaiagent.com',
    type: 'website',
    images: [
      {
        url: 'https://www.denbegnayeaiagent.com/denbegnaye-og.png',
        width: 1200,
        height: 630,
        alt: 'Denbegnaye - Build AI Agents Without Limits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Denbegnaye - Build AI Agents Without Limits',
    description:
      'Denbegnaye is a visual AI agent builder for no-code workflow automation, with Office Intelligence tools for analyzing documents and business data.',
    images: ['https://www.denbegnayeaiagent.com/denbegnaye-og.png'],
  },
  icons: {
    icon: '/denbegnaye-logo.png',
    shortcut: '/denbegnaye-logo.png',
    apple: '/denbegnaye-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className="min-h-screen bg-[var(--bg-page)] font-sans text-[var(--text-primary)] antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative min-h-screen">
              <SiteHeader />
              <div className="relative z-0">{children}</div>
              <SiteFooter />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
