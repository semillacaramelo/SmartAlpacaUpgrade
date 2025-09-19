import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import CompactActivityFeed from "./CompactActivityFeed";
import { useTradingData } from "@/hooks/use-trading-data";
import { useWebSocket } from "@/hooks/use-websocket";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { systemMetrics } = useTradingData();
  const { isConnected } = useWebSocket();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isConnected={isConnected}
          botStatus={systemMetrics?.bot_status || "stopped"}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <CompactActivityFeed />
    </div>
  );
}
