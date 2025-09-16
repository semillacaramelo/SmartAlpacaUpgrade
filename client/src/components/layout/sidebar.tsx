import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line", current: true },
  { name: "Portfolio", href: "/portfolio", icon: "fas fa-wallet", current: false },
  { name: "Strategies", href: "/strategies", icon: "fas fa-cogs", current: false },
  { name: "Backtest", href: "/backtest", icon: "fas fa-history", current: false },
  { name: "Audit Log", href: "/audit", icon: "fas fa-list-alt", current: false },
  { name: "Risk Management", href: "/risk", icon: "fas fa-shield-alt", current: false },
  { name: "Settings", href: "/settings", icon: "fas fa-cog", current: false },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Smart Alpaca</h1>
            <p className="text-xs text-muted-foreground">AI Trading System</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
          return (
            <Link key={item.name} href={item.href}>
              <a 
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                data-testid={`nav-link-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <i className={`${item.icon} w-5`}></i>
                <span className={isActive ? "font-medium" : ""}>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <i className="fas fa-user text-muted-foreground text-sm"></i>
          </div>
          <div>
            <p className="text-sm font-medium">Alex Trader</p>
            <p className="text-xs text-muted-foreground">Premium Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
