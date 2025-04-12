import './globals.css'
import { Inter } from 'next/font/google'
import StoreInitializer from '../components/StoreInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Weather',
  description: 'Get accurate weather forecasts for your area',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StoreInitializer />
        {children}
      </body>
    </html>
  )
}
