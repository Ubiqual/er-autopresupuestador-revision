import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import React from 'react';

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-grow">{children}</main> {/* This pushes the footer down */}
      <Footer />
    </>
  );
}
