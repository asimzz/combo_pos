import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Combo Restaurant - Point of Sale System',
  description: 'Modern restaurant point of sale system for Combo Restaurant - Different Every Time. Always You.',
  icons: {
    icon: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            duration={4000}
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  '!bg-card !border !border-card-border !text-gray-900 !shadow-sm !rounded-lg',
                title: '!text-sm !font-medium !text-gray-900',
                description: '!text-xs !text-muted',
                success: '[&_[data-icon]]:!text-success',
                error: '[&_[data-icon]]:!text-error',
                warning: '[&_[data-icon]]:!text-warning',
                info: '[&_[data-icon]]:!text-primary-500',
                closeButton:
                  '!bg-card !border-card-border !text-muted hover:!text-gray-900',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}