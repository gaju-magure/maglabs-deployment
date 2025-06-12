import React from 'react';
import { User, Bot, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ChatMessage as ChatMessageType } from '@/services/chatApi';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.message_type === 'error';
  const isSystem = message.role === 'system';
  
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-blue-500" 
          : isError 
          ? "bg-red-500" 
          : isSystem
          ? "bg-gray-500"
          : "bg-gray-700"
      )}>
        {isUser ? (
          <User size={16} className="text-white" />
        ) : isError ? (
          <AlertCircle size={16} className="text-white" />
        ) : isSystem ? (
          <Info size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>
      
      <div className={cn("flex-1 space-y-1", isUser && "text-right")}>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">
            {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
          </span>
          <span>{message.formatted_time}</span>
          {message.ai_metadata?.interview_stage && (
            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs">
              {message.ai_metadata.interview_stage.replace('_', ' ')}
            </span>
          )}
        </div>
        
        <div className={cn(
          "inline-block px-4 py-2 rounded-2xl max-w-[80%]",
          isUser 
            ? "bg-blue-500 text-white" 
            : isError 
            ? "bg-red-50 text-red-900 border border-red-200"
            : isSystem
            ? "bg-gray-50 text-gray-900 border border-gray-200"
            : "bg-gray-100 text-gray-900"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {message.ai_metadata?.usage && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Tokens: {message.ai_metadata.usage.total_tokens}</span>
                {message.ai_metadata.processing_time_ms && (
                  <span>{message.ai_metadata.processing_time_ms}ms</span>
                )}
              </div>
            </div>
          )}
          
          {message.message_type === 'submission' && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700">Idea submitted</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};