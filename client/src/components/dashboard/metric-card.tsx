import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: string;
  className?: string;
  isPositive?: boolean;
  'data-testid'?: string;
}

const iconMap = {
  wallet: "fas fa-wallet",
  "chart-line": "fas fa-chart-line",
  list: "fas fa-list",
  bullseye: "fas fa-bullseye",
};

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  isPositive = true,
  'data-testid': dataTestId,
}: MetricCardProps) {
  const iconClass = iconMap[icon as keyof typeof iconMap] || "fas fa-chart-line";
  const changeColor = isPositive ? "text-success" : "text-destructive";
  const bgColor = isPositive ? "bg-success/10" : "bg-destructive/10";
  const iconColor = isPositive ? "text-success" : "text-destructive";

  return (
    <div 
      className={cn("bg-card rounded-lg border border-border p-6 status-indicator", className)}
      data-testid={dataTestId}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold" data-testid={`${dataTestId}-value`}>{value}</p>
          <p className={cn("text-sm font-medium mt-1", changeColor)}>
            <i className="fas fa-arrow-up mr-1"></i>
            {changeLabel}
          </p>
        </div>
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", bgColor)}>
          <i className={cn(iconClass, "text-xl", iconColor)}></i>
        </div>
      </div>
    </div>
  );
}
