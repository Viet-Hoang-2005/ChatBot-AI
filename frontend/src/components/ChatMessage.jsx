import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ role = 'assistant', children, time }) {
  const isUser = role === 'user';
  const isStringContent = typeof children === 'string';

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] md:max-w-[70%]`}>
        
        {/* Bong bóng tin nhắn */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-soft text-sm md:text-base leading-relaxed break-words ${
            isUser
              ? 'bg-bubbleUser text-gray-100 rounded-br-md'
              : 'bg-bubbleBot text-gray-200 rounded-bl-md'
          }`}
        >
          {/* Xử lí văn bản Markdown */}
          {isUser ? (
             <span className="whitespace-pre-wrap">{children}</span>
          ) : (
             isStringContent ? (
               <ReactMarkdown 
                 components={{
                   ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2" {...props} />,
                   ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2" {...props} />,
                   strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                   a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                 }}
               >
                 {children}
               </ReactMarkdown>
             ) : (
               children
             )
          )}
        </div>
        
        {/* Thanh ngang thời gian */}
        {isUser && time && (
          <span className="text-xs text-gray-400 mt-1">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}