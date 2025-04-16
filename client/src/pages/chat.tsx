import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatProvider } from "@/hooks/use-chat";
import { DashboardLayout } from "@/layouts/dashboard-layout";

export default function ChatPage() {
  return (
    <DashboardLayout>
      <ChatProvider>
        <div className="h-[calc(100vh-64px)]">
          <ChatLayout />
        </div>
      </ChatProvider>
    </DashboardLayout>
  );
}