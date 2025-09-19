import { useToast } from "@/hooks/use-toast";
import { XCircle, AlertTriangle, Info } from "lucide-react";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

const DEFAULT_DURATION = 5000;

export function useErrorToast() {
  const { toast } = useToast();

  const showErrorToast = (message: string, options: ToastOptions = {}) => {
    toast({
      title: options.title || "Error",
      description: message,
      duration: options.duration || DEFAULT_DURATION,
      variant: "destructive",
    });
  };

  const showWarningToast = (message: string, options: ToastOptions = {}) => {
    toast({
      title: options.title || "Warning",
      description: message,
      duration: options.duration || DEFAULT_DURATION,
      variant: "default",
    });
  };

  const showInfoToast = (message: string, options: ToastOptions = {}) => {
    toast({
      title: options.title || "Info",
      description: message,
      duration: options.duration || DEFAULT_DURATION,
      variant: "default",
    });
  };

  return {
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };
}
