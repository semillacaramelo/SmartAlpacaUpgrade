import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorDisplayProps {
  message: string;
  severity: "error" | "warning" | "info";
  details?: string;
  onDismiss?: () => void;
  className?: string;
}

const iconMap = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityStyles = {
  error: "border-destructive text-destructive",
  warning: "border-warning text-warning",
  info: "border-info text-info",
};

export function ErrorDisplay({
  message,
  severity = "error",
  details,
  onDismiss,
  className,
}: ErrorDisplayProps) {
  const Icon = iconMap[severity];

  return (
    <Alert
      variant={severity === "error" ? "destructive" : "default"}
      className={cn(severityStyles[severity], className)}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle>{message}</AlertTitle>
      {details && <AlertDescription>{details}</AlertDescription>}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <XCircle className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </Alert>
  );
}
