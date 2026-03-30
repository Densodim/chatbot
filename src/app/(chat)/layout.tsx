import { ChatWorkspace } from '@/components/sidebar/ChatWorkspace'

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ChatWorkspace>{children}</ChatWorkspace>
}
