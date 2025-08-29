import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import FingerprintCollector from '@/components/FingerprintCollector';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "ShotPack — Product photo packs in seconds",
  description: "Turn one photo into 6 catalog-ready shots. True consistency, no props added.",
  icons: { 
    icon: "/favicon.svg",
    apple: "/favicon.svg"
  },
  openGraph: {
    title: "ShotPack",
    description: "Generate product photo packs instantly from a single image.",
    images: ["/examples/out-1.jpg"]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <FingerprintCollector />
          <Header />
          <main>{children}</main>
          <footer className="bg-gray-50 border-t mt-16 py-8">
            <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="text-gray-600">ShotPack</span>
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="text-gray-500">AI-powered product photography</span>
              </div>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Generated images preserve your product identity. No people, pets, hands, phones or text added.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}