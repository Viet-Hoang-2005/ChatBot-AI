import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Plus} from "lucide-react";
import { askTools, resetConversation } from "../lib/api.js";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import ChatMessage from "../components/ChatMessage.jsx";
import MessageInput from "../components/MessageInput.jsx";
import SuggestionCard from "../components/SuggestionCard.jsx";
import ComparisonTable from "../components/ComparisonTable.jsx";
import Modal from "../components/Modal.jsx";

const LS_KEY = "chat_messages_v1";

/* Header */
function Header({ onBackToIntro, onReset, onScrollToBottom }) {
  return (
    <header className="sticky top-0 z-20">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-5">
        <div className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-5 py-3">

          {/* Button Back */}
          <button
            onClick={onBackToIntro}
            className="absolute left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110"
            title="Trở về trang giới thiệu"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Title */}
          <span
            onClick={onScrollToBottom}
            className="font-semibold tracking-wide text-white text-center cursor-pointer hover:text-pink-400 transition"
            title="Cuộn xuống cuối đoạn chat"
          >
            ChatBot AI gợi ý công cụ học tập
          </span>

          {/* Button Reset */}
          <button
            onClick={onReset}
            className="absolute right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110"
            title="Tạo cuộc hội thoại mới"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>

        </div>
      </div>
    </header>
  );
}

/* Khối Welcome */
function Welcome({ onExampleClick }) {
  // Prompt minh họa
  const examples = [
    "Tôi muốn lên kế hoạch nội dung và đăng bài tự động",
    "Có app nào kết hợp lịch, việc và ghi chú không?",
    "Công cụ nào giúp tôi quản lý thời gian hiệu quả?",
  ];
  return (
    <div className="rounded-2xl p-5 sm:p-6">
      {/* Logo + Xin chào */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <img src="/src/assets/logo.png" alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
        <h2 className="text-2xl font-semibold text-white">Xin chào bạn!</h2>
      </div>
      
      {/* Mô tả */}
      <p className="text-sm text-white/80">
        Hãy đưa ra những yêu cầu trong học tập hay làm việc của bạn. 
        Mình sẽ đề xuất những công cụ hữu ích trên Internet, 
        kèm các bước hướng dẫn sử dụng, để đáp ứng nhu cầu của bạn.
      </p>

      {/* Button prompt */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(ex)}
            className="text-left text-sm px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/90"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Lấy ngày hiện tại định dạng dd/mm/yyyy */
function getTodayLabel() {
  return new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* Trang chat chính */
export default function ChatPage() {
  const navigate = useNavigate(); // Điều hướng trang
  const [messages, setMessages] = useState(() => { // Xem tin nhắn từ localStorage
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [activeSuggestion, setActiveSuggestion] = useState(null); // Tool đang mở modal
  const [prefillText, setPrefillText] = useState(""); // Text gợi ý cho input
  const [loading, setLoading] = useState(false); // Trạng thái bot trả lời
  const [errorText, setErrorText] = useState(""); // Lỗi chung
  
  const abortControllerRef = useRef(null);  // Ref AbortController để hủy request
  const scrollRef = useRef(null); // Ref vùng scroll chính
  const hasMessages = useMemo(() => messages.length > 0, [messages]); // Có tin nhắn hay không

  const suggestionAnchorRef = useRef(null); // Ref khối gợi ý mới nhất
  const [shouldScrollToSuggestion, setShouldScrollToSuggestion] = useState(false); // Có nên scroll đến khối gợi ý mới

  // Cuộn xuống cuối vùng chat
  function scrollToBottom(behavior = "smooth") {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior,
    });
  }

  // Lưu messages vào localStorage
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll khi mới vào trang
  useEffect(() => {
    scrollToBottom("smooth");
  }, []);

  // Auto-scroll khi có tin nhắn đang loading
  useEffect(() => {
    if (loading)
      scrollToBottom("smooth");
  }, [loading]);

  // Auto-scroll đến khối gợi ý khi có tin nhắn suggestion mới
  useEffect(() => {
    if (!shouldScrollToSuggestion) return;
    const el = suggestionAnchorRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const HEADER_OFFSET = 220;
      const targetY = window.scrollY + rect.top - HEADER_OFFSET;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });
    }
  setShouldScrollToSuggestion(false);
}, [shouldScrollToSuggestion, messages]);

  // Cleanup abort controller khi unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Hàm reset cuộc hội thoại
  function handleReset() {
    // Hủy request đang chạy (nếu có)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset UI FE
    setMessages([]);
    setActiveSuggestion(null);
    setErrorText("");
    setPrefillText("");
    setLoading(false);
    
    // Xoá localStorage
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* noop */
    }

    // Gọi API reset BE
    resetConversation().catch((err) => {
    console.error("Reset cuộc hội thoại trên Server thất bại: ", err);
  });

    requestAnimationFrame(() => scrollToBottom("auto"));
  }

  // Hàm dừng bot phản hồi
  function handleStopBot() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    
    // Thêm tin nhắn thông báo đã dừng
    const dateStr = getTodayLabel();
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Đã dừng phản hồi theo yêu cầu của bạn!",
        date: dateStr,
      },
    ]);
  }

  /* Map dữ liệu tool từ backend */
  function mapToolsForUI(tools = []) {
    return tools.slice(0, 3).map((t) => { // Chỉ lấy tối đa 3 tool
       // Lấy Icon từ Google Favicon service
      const favicon = t?.url
        ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
            t.url
          )}&size=64`
        : null;

      return {
        title: t?.name || "Công cụ", // Tên tool
        summary: // Mô tả ngắn
          t?.description || null,

        link: t?.url || null, // Link công cụ
        favicon, // Icon tool

        details: { // Thông tin chi tiết
          overview: [
            t?.category && `- Nhóm: ${t.category}`,
            t?.pricing && `- Chi phí: ${t.pricing}`,
            t?.setup_time && `- Thời gian thiết lập: ${t.setup_time}`,
            t?.difficulty_level && `- Độ khó: ${t.difficulty_level}`,
          ].filter(Boolean),

          advantages: t?.advantages || null, // Ưu điểm
          disadvantages: t?.disadvantages || null, // Nhược điểm
          quickGuide: t?.quick_guide || null, // Hướng dẫn nhanh
          bestFor: t?.best_for || null, // Phù hợp nhất cho
        },
      };
    });
  }

  /* Gửi câu hỏi, gọi BE và render */
  function addUserMessage(text) {
    if (!text || !text.trim()) return;

    // Lấy thời gian hiện tại của user
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = getTodayLabel();

    // Thêm tin nhắn user và cuộn ngay
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text.trim(),
        time: timeStr,
        date: dateStr,
      },
    ]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    // Tạo AbortController mới để hủy request nếu cần
    abortControllerRef.current = new AbortController();

    setErrorText("");
    setLoading(true);

    // Gọi BE
    askTools(text.trim(), abortControllerRef.current.signal)
      .then((data) => {
        // Case bot trả lời bình thường
        if (data?.mode === "chat") {
          const now2 = new Date();
          const timeStr2 = now2.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                data.reply ||
                "Xin lỗi, mình chưa có câu trả lời phù hợp cho câu hỏi này.",
              time: timeStr2,
              date: dateStr,
            },
          ]);
          requestAnimationFrame(() => scrollToBottom("smooth"));
          return;
        }

        // Case bot trả lời gợi ý tool
        const tools = Array.isArray(data?.recommended_tools)
          ? data.recommended_tools
          : [];
        const mapped = mapToolsForUI(tools);

        const extra = [];

        if (Array.isArray(data?.comparison) && data.comparison.length) {
          extra.push({
            role: "assistant",
            type: "preface",
            content: "**So sánh nhanh giữa các lựa chọn:**",
          });
          extra.push({
            role: "assistant",
            type: "comparisonTable",
            tools: mapped,
            comparisons: data.comparison,
          });
        }

        if (
          Array.isArray(data?.final_recommendation) &&
          data.final_recommendation.length
        ) {
          extra.push({
            role: "assistant",
            type: "preface",
            content: "**Kết luận nhanh:**",
          });
          extra.push({
            role: "assistant",
            content: data.final_recommendation.join("\n\n"),
          });
        }

        if (Array.isArray(data?.next_steps) && data.next_steps.length) {
          extra.push({
            role: "assistant",
            type: "preface",
            content: "**Các bước tiếp theo bạn có thể làm:**",
          });
          extra.push({
            role: "assistant",
            content: data.next_steps
              .map((s, i) => `${i + 1}. ${s}`)
              .join("\n"),
          });
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "preface",
            content: data.intro,
            date: dateStr,
          },
          {
            role: "assistant",
            type: "suggestionRow",
            payload: mapped,
            date: dateStr,
          },
          ...extra.map((m) => ({ ...m, date: dateStr })),
        ]);

        setShouldScrollToSuggestion(true);
      })

      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('Request đã bị hủy');
          return;
        }
        
        setErrorText(err?.message || "Không thể gọi API.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Xin lỗi, hiện không thể lấy gợi ý từ máy chủ. Hãy thử lại sau.",
            date: dateStr,
          },
        ]);
      })
      .finally(() => {
        setLoading(false);
        abortControllerRef.current = null;
      });
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#0b0f16] text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_0%_100%,rgba(236,72,153,0.18)_0%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(124,58,237,0.12)_0%,transparent_55%)]"
      />

      <Header
        onBackToIntro={() => navigate('/')}
        onReset={handleReset}
        onScrollToBottom={() => scrollToBottom("smooth")}
      />

      {/* Khung chính căn giữa */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="relative z-10 flex-1 overflow-y-auto pb-40"
        ref={scrollRef}
      >
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-6">
          {/* Vùng chat căn giữa */}
          <div className="mx-auto w-full max-w-3xl">
            {!hasMessages && (
              <div className="mb-6">
                <Welcome onExampleClick={(text) => setPrefillText(text)} />
              </div>
            )}

            {(() => {
              let lastDate = null;
              
              const lastSuggestionIndex = messages.reduceRight(
                (acc, msg, index) =>
                  acc === -1 && msg.type === "suggestionRow" ? index : acc,
                -1
              );

              return messages.map((m, idx) => {
                const showDate = m.date && m.date !== lastDate;
                if (showDate) lastDate = m.date;

                // Thanh ngày tháng năm
                const dateSeparator = showDate ? (
                  <div key={`date-${idx}`} className="flex items-center my-4">
                    <div className="flex-grow border-t border-white/10" />
                    <span className="mx-3 text-xs text-gray-400 whitespace-nowrap">
                      {m.date}
                    </span>
                    <div className="flex-grow border-t border-white/10" />
                  </div>
                ) : null;

                // Tin nhắn preface
                if (m.type === "preface") {
                  return (
                    <>
                      {dateSeparator}
                      <ChatMessage role="assistant">
                        {m.content}
                      </ChatMessage>
                    </>
                  );
                }

                // Hàng suggestion
                if (m.type === "suggestionRow") {
                  const items = m.payload || [];
                  const isLatestSuggestion = idx === lastSuggestionIndex;

                  return (
                    <>
                      {dateSeparator}
                      <div
                        className="w-full my-3"
                        ref={isLatestSuggestion ? suggestionAnchorRef : null}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {items.map((s, i) => (
                            <SuggestionCard
                              key={i}
                              title={s.title}
                              summary={s.summary}
                              iconUrl={s.favicon}
                              onOpen={() => setActiveSuggestion(s)}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  );
                }

                // Bảng so sánh
                if (m.type === "comparisonTable") {
                  return (
                    <>
                      {dateSeparator}
                      <div className="w-full my-3">
                        <ComparisonTable 
                          tools={m.tools || []} 
                          comparisonTexts={m.comparisons || []} 
                        />
                      </div>
                    </>
                  );
                }

                // Tin nhắn bình thường (user / assistant)
                return (
                <>
                  {dateSeparator}
                  <ChatMessage role={m.role} time={m.time}>
                    {m.content}
                  </ChatMessage>
                </>
              );
              });
            })()}

            {loading && (
              <ChatMessage role="assistant">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400">
                    Đang xử lí yêu cầu của bạn
                  </span>
                  <div className="flex items-end space-x-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce" />
                  </div>
                </div>
              </ChatMessage>
            )}

            {!!errorText && (
              <ChatMessage role="assistant">Lỗi: {errorText}</ChatMessage>
            )}
          </div>
        </div>
      </motion.main>

      {/* Input cố định dưới */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 z-20 pb-4"
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <MessageInput 
            onSend={addUserMessage} 
            onStop={handleStopBot}
            prefill={prefillText}
            isLoading={loading}
          />
        </div>
      </motion.div>

      {/* Modal chi tiết tool */}
      <Modal
        open={!!activeSuggestion}
        title={activeSuggestion?.title}
        iconUrl={activeSuggestion?.favicon}
        link={activeSuggestion?.link}
        summary={activeSuggestion?.summary}
        details={activeSuggestion?.details}
        bestFor={activeSuggestion?.details?.bestFor}
        onClose={() => setActiveSuggestion(null)}
      />
    </div>
  );
}