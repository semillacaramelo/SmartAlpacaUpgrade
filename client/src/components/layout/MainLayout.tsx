import { ReactNode } from "react";
import { Header } from "./Header";
import Sidebar from "./sidebar";
import { useTradingData } from "@/hooks/use-trading-data";
import { useWebSocket } from "@/hooks/use-websocket";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const tradingData = useTradingData();
  const wsData = useWebSocket();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          wsConnected={wsData.isConnected}
          isApiConnected={!tradingData.error}
          botStatus={tradingData.systemMetrics?.bot_status === "running" ? "active" :
            tradingData.systemMetrics?.bot_status === "error" ? "error" : "stopped"}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}