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
    <div className={cn("flex gap-3 mb-6", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "chat-avatar",
        isUser 
          ? "chat-avatar-user" 
          : "chat-avatar-ai"
      )}>
        {isUser ? (
          <User size={16} />
        ) : isError ? (
          <AlertCircle size={16} />
        ) : isSystem ? (
          <Info size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>
      
      {/* Message Content */}
      <div className={cn("flex-1 space-y-1", isUser && "flex flex-col items-end")}>
        {/* Message Header */}
        <div className={cn(
          "flex items-center gap-2 text-xs",
          isUser ? "flex-row-reverse text-right" : "",
          "text-gray-500"
        )}>
          <span className="font-medium">
            {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
          </span>
          <span>{message.formatted_time}</span>
          {message.ai_metadata?.interview_stage && (
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {message.ai_metadata.interview_stage.replace('_', ' ')}
            </span>
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={cn(
          "inline-block px-4 py-3 max-w-[80%] font-medium",
          isUser 
            ? "chat-message-user" 
            : isError 
            ? "bg-red-50 text-red-900 border border-red-200 rounded-xl"
            : isSystem
            ? "bg-gray-50 text-gray-900 border border-gray-200 rounded-xl"
            : "chat-message-ai"
        )}>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </div>
          
          {/* Metadata */}
          {message.ai_metadata?.usage && (
            <div className="mt-3 pt-2 border-t border-gray-200/50 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Tokens: {message.ai_metadata.usage.total_tokens.toLocaleString()}</span>
                {message.ai_metadata.processing_time_ms && (
                  <span>{message.ai_metadata.processing_time_ms}ms</span>
                )}
              </div>
            </div>
          )}
          
          {/* Submission Status */}
          {message.message_type === 'submission' && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">Idea submitted successfully</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};