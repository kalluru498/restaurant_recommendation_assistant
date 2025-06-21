import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './global.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Restaurant Chatbot - Find Your Perfect Meal',
  description: 'AI-powered restaurant recommendations using Reddit and web reviews',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}