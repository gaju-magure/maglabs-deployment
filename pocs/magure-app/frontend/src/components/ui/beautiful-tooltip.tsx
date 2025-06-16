import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface BeautifulTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  variant?: "default" | "glass" | "dark" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  delay?: number;
  mobileEnabled?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-white border border-gray-200 text-gray-900 shadow-lg",
  glass: "bg-white/90 backdrop-blur-md border border-white/20 text-gray-900 shadow-xl",
  dark: "bg-gray-900 border border-gray-700 text-white shadow-xl",
  success: "bg-green-50 border border-green-200 text-green-900 shadow-lg",
  warning: "bg-amber-50 border border-amber-200 text-amber-900 shadow-lg",
  error: "bg-red-50 border border-red-200 text-red-900 shadow-lg",
};

const sizeStyles = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-sm",
};

export const BeautifulTooltip: React.FC<BeautifulTooltipProps> = ({
  children,
  content,
  position = "top",
  variant = "default",
  size = "md",
  delay = 300,
  mobileEnabled = true,
  className,
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Disable on mobile if mobileEnabled is false
  if (isMobile && !mobileEnabled) {
    return <>{children}</>;
  }

  const tooltipContent = (
    <TooltipPrimitive.Content
      side={position}
      sideOffset={8}
      className={cn(
        "z-50 overflow-hidden rounded-xl",
        variantStyles[variant],
        sizeStyles[size],
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        isMobile && "max-w-xs", // Limit width on mobile
        className
      )}
    >
      {content}
      <TooltipPrimitive.Arrow 
        className={cn(
          "fill-current",
          variant === "glass" ? "text-white/90" : 
          variant === "dark" ? "text-gray-900" : "text-white"
        )} 
      />
    </TooltipPrimitive.Content>
  );

  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        {tooltipContent}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

// Specialized tooltip for stage progress
interface StageTooltipContentProps {
  stageName: string;
  description: string;
  status: "completed" | "active" | "pending";
  completion?: number;
  threshold?: number;
}

export const StageTooltipContent: React.FC<StageTooltipContentProps> = ({
  stageName,
  description,
  status,
  completion,
  threshold,
}) => {
  const statusColors = {
    completed: "text-green-600 bg-green-100",
    active: "text-blue-600 bg-blue-100", 
    pending: "text-gray-500 bg-gray-100",
  };

  const statusLabels = {
    completed: "Completed",
    active: "In Progress",
    pending: "Upcoming",
  };

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-sm leading-tight">{stageName}</h4>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
          statusColors[status]
        )}>
          {statusLabels[status]}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 leading-relaxed">
        {description}
      </p>
      
      {completion !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{Math.round(completion * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                completion >= (threshold || 0.7) ? "bg-green-500" : "bg-amber-500"
              )}
              style={{ width: `${Math.min(completion * 100, 100)}%` }}
            />
          </div>
          {threshold && (
            <p className="text-xs text-gray-500">
              Target: {Math.round(threshold * 100)}%
              {completion >= threshold ? " ✓" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Compact tooltip for sidebar chat sessions
interface ChatSessionTooltipContentProps {
  title: string;
  preview: string;
  timeAgo: string;
  messageCount: number;
  isIdeaSubmitted?: boolean;
}

export const ChatSessionTooltipContent: React.FC<ChatSessionTooltipContentProps> = ({
  title,
  preview,
  timeAgo,
  messageCount,
  isIdeaSubmitted,
}) => {
  return (
    <div className="space-y-2 max-w-xs">
      <h4 className="font-semibold text-sm leading-tight">{title}</h4>
      
      {preview && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
          {preview}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{timeAgo}</span>
        <span>{messageCount} messages</span>
      </div>
      
      {isIdeaSubmitted && (
        <div className="flex items-center gap-1 text-xs">
          <span className="text-green-600">💡</span>
          <span className="text-green-700 font-medium">Idea Submitted</span>
        </div>
      )}
    </div>
  );
};

export default BeautifulTooltip;