import { BusSelectionProvider } from '@/contexts/BusSelectionContext';
import { DailyStopsProvider } from '@/contexts/DailyStopsContext';
import { LocationsProvider } from '@/contexts/LocationsContext';
import { ToastModalProvider } from '@/contexts/ToastModalContext';
import { BASE_URL } from '@/utils/constants';
import type { Metadata } from 'next';
import Script from 'next/script';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Presupuesto Alquiler de Autocares y Coches con Esteban Rivas',
  description:
    'Alquiler de autocares, minibuses, minivans y coches de todas las capacidades y categorías. Con cobertura de servicio en toda España.',
  icons: {
    icon: [
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/favicon.ico', type: 'image/x-icon' }
    ],
    apple: '/favicons/apple-touch-icon.png',
    other: [
      { url: '/favicons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Presupuesto de Alquiler de Autocares - Esteban Rivas',
    description:
      'Alquiler de autocares, minibuses, minivans y coches de todas las capacidades y categorías. Servicio en toda España con la máxima comodidad y seguridad.',
    url: BASE_URL,
    siteName: 'Esteban Rivas',
    images: [
      {
        url: `${BASE_URL}/images/metadata_bus.jpg`,
        width: 1200,
        height: 630,
        alt: 'Esteban Rivas - Alquiler de Autocares'
      }
    ],
    type: 'website',
    locale: 'es_ES'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Presupuesto de Alquiler de Autocares - Esteban Rivas',
    description: 'Alquiler de autocares, minibuses, minivans y coches en toda España. Máxima comodidad y seguridad.',
    images: [`${BASE_URL}/images/metadata_bus.jpg`],
    creator: '@estebanrivas'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Google Tag Manager (GTM) */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WVMD8CSS');
          `}
        </Script>
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google Tag Manager (noscript) - Required for non-JS users */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WVMD8CSS"
            height="0"
            width="0"
            style={{
              display: 'none',
              visibility: 'hidden'
            }}
          ></iframe>
        </noscript>
        <ToastModalProvider>
          <DailyStopsProvider>
            <BusSelectionProvider>
              <LocationsProvider>
                <div className="flex flex-col min-h-screen w-full">{children}</div>
              </LocationsProvider>
            </BusSelectionProvider>
          </DailyStopsProvider>
        </ToastModalProvider>
      </body>
    </html>
  );
}
