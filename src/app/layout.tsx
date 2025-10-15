import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientProviders from '@/components/providers/ClientProviders';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'note記事自動生成エージェント',
  description: 'noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします',
  keywords: ['note', '記事生成', 'AI', 'SEO', 'ブログ', '自動化'],
  authors: [{ name: 'note記事自動生成エージェント' }],
  creator: 'note記事自動生成エージェント',
  publisher: 'note記事自動生成エージェント',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://note-agent.vercel.app',
    title: 'note記事自動生成エージェント',
    description: 'noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします',
    siteName: 'note記事自動生成エージェント',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'note記事自動生成エージェント',
    description: 'noteの記事作成をAIで自動化し、あなたの執筆活動をサポートします',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-pink-900">
            {children}
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}