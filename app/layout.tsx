import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';

// const _geist = Geist({ subsets: ["latin"] });
// const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Denbegnaye - AI-Powered Digital Marketing Toolkit',
  description:
    'Denbegnaye: professional AI-powered digital marketing toolkit for creators. Automate campaigns across social and content workflows.',
  keywords: 'Denbegnaye, AI marketing, social media automation, content creation, digital tools',
  authors: [{ name: 'Denbegnaye Team' }],
  openGraph: {
    title: 'Denbegnaye - AI-Powered Digital Marketing Toolkit',
    description: 'Unlock the power of AI for your marketing and social growth with Denbegnaye',
    type: 'website',
    images: ['/denbegnaye-logo.png'],
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
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
