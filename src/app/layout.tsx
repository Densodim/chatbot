import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import QueryProvider from '@/providers/query-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chatbot',
  description: 'ChatGPT-like chatbot',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='flex min-h-full flex-col bg-[color:var(--color-shell)] text-[color:var(--color-foreground)]'>
        <QueryProvider>
          {children}
          <Toaster richColors position='top-right' />
        </QueryProvider>
      </body>
    </html>
  )
}
