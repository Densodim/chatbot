import { ChatPage } from '@/components/chat/ChatPage'

export default async function ChatDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ChatPage chatId={id} />
}
