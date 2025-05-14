import { NewChatLayout } from "@/components/chat/new-chat-layout";
import { ChatProvider } from "@/hooks/use-chat";
import DashboardLayout from "@/layouts/dashboard-layout";

export default function ChatPage() {
  return (
    <DashboardLayout>
      <ChatProvider>
        <div className="h-[calc(100vh-64px)]">
          <NewChatLayout />
        </div>
      </ChatProvider>
    </DashboardLayout>
  );
}