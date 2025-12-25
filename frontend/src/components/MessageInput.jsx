import { useState, useEffect, useRef } from 'react';
import { Send, Square, Mic } from "lucide-react";

export default function MessageInput({ onSend, onStop, prefill, isLoading }) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);

  // Cuộn xuống cuối trang ngay sau khi gửi
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
    });
  };

  // Nhận prefill và tự gửi (nếu có), sau đó cuộn xuống cuối
  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      setTimeout(() => {
        onSend(prefill);
        setValue('');
        scrollToBottom();
      }, 200);
    }
  }, [prefill]);

  // Auto-resize theo nội dung
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    const scrollH = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = Math.min(scrollH, 160) + 'px';
  }, [value]);

  // Gửi khi nhấn Enter
  function handleKey(e) {
    if (e.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSend(value.trim());
        setValue('');
        scrollToBottom();
      }
    }
  }

  // Xử lý nhận diện giọng nói
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói.");
      return;
    }

    if (isListening) {
      window.speechRecognitionInstance?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    window.speechRecognitionInstance = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setValue(prev => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error("Lỗi nhận diện giọng nói:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if(textareaRef.current) textareaRef.current.focus();
    };

    recognition.start();
  };

  // Xử lý click nút hành động ghi âm, gửi hoặc dừng
  function handleClick() {
    if (isLoading) {
      onStop();
    }
    else if (value.trim()) {
      onSend(value.trim());
      setValue('');
      scrollToBottom();
    }
    else {
      handleVoiceInput();
    }
  }

  // Xác định icon hiển thị
  const renderIcon = () => {
    if (isLoading) return <Square className="w-5 h-5 text-red-400" />;
    if (value.trim()) return <Send className="w-5 h-5 text-white" />;
    
    return <Mic className={`w-5 h-5 ${isListening ? 'text-red-500 animate-pulse' : 'text-white'}`} />;
  };

  return (
    <div>
      <div className={`
        border border-white/10 bg-panel/60 backdrop-blur-xl rounded-2xl 
        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-2 transition-colors
        ${isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'hover:border-blue-600/60'}
      `}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={isListening ? "Đang nghe bạn nói..." : "Nhập nhu cầu học tập của bạn..."}
          className="w-full bg-transparent text-gray-100 outline-none resize-none px-3 py-3 text-sm md:text-base"
          rows={1}
          aria-label="Nhập tin nhắn"
        />
        <div className="flex justify-end px-2 pb-1">
          {/* Button Gửi / Dừng Bot / Ghi âm */}
          <button
            onClick={handleClick}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full
              border backdrop-blur
              transition-all duration-300
              hover:scale-110
              will-change-transform 
              ${isLoading 
                ? 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30' 
                : isListening
                  ? 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }
            `}
            title={
              isLoading ? "Dừng bot phản hồi" 
              : value.trim() ? "Gửi tin nhắn" 
              : isListening ? "Dừng ghi âm" : "Nhấn để nói"
            }
          >
            {renderIcon()}
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        ChatBot AI có thể mắc lỗi. Hãy kiểm tra kĩ các thông tin quan trọng
      </p>
    </div>
  );
}