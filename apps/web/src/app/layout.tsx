// apps/web/src/app/layout.tsx

import './globals.css'                              // 1) import your global styles (with @tailwind + helpers)
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'

/** 2) set up your Google fonts as CSS variables **/
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Card Vault',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {/*
        3) apply your font variables to <html>,
           and pull in your Tailwind helper classes on <body>:
           - bg-[var(--background)] / text-[var(--foreground)] come from your :root CSS vars
           - font-sans (from Tailwind) picks up --font-geist-sans
      */}
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <body className="bg-[var(--background)] text-[var(--foreground)] font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
