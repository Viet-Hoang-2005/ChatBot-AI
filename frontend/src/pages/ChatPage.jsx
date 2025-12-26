import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, History, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

// Import API và Components
import { askTools, getUserSessions, deleteAllHistory, getSessionHistory, renameSession, deleteSession } from "../lib/api.js";
import HistoryModal from "../components/HistoryModal.jsx";
import ChatMessage from "../components/ChatMessage.jsx";
import MessageInput from "../components/MessageInput.jsx";
import SuggestionCard from "../components/SuggestionCard.jsx";
import ComparisonTable from "../components/ComparisonTable.jsx";
import ToolModal from "../components/ToolModal.jsx";
import logoImage from '../assets/logo.png';

// --- HELPER FUNCTIONS ---

/* Lấy ngày hiện tại định dạng dd/mm/yyyy */
function getTodayLabel() {
  return new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/* Hàm lấy giờ từ chuỗi ISO (VD: 2023... -> 14:30) */
function formatTimeFromISO(isoString) {
  if (!isoString) return "";
  
  const safeIsoString = (isoString.endsWith("Z") || isoString.includes("+")) 
    ? isoString 
    : isoString + "Z";
  const date = new Date(safeIsoString);
  
  return date.toLocaleTimeString("vi-VN", { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: "Asia/Ho_Chi_Minh", 
  });
}

/* Hàm lấy ngày từ chuỗi ISO (VD: 2023... -> 25/12/2025) */
function formatDateFromISO(isoString) {
  if (!isoString) return getTodayLabel();

  const safeIsoString = (isoString.endsWith("Z") || isoString.includes("+")) 
      ? isoString 
      : isoString + "Z";
  const date = new Date(safeIsoString);

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/* Map dữ liệu tool từ backend sang format UI */
function mapToolsForUI(tools = []) {
  return tools.slice(0, 3).map((t) => {
    const favicon = t?.url
      ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(t.url)}&size=64`
      : null;

    return {
      title: t?.name || "Công cụ",
      summary: t?.description || null,
      link: t?.url || null,
      favicon,
      details: {
        overview: [
          t?.category && `- Nhóm: ${t.category}`,
          t?.pricing && `- Chi phí: ${t.pricing}`,
          t?.setup_time && `- Thời gian thiết lập: ${t.setup_time}`,
          t?.difficulty_level && `- Độ khó: ${t.difficulty_level}`,
        ].filter(Boolean),
        advantages: t?.advantages || null,
        disadvantages: t?.disadvantages || null,
        quickGuide: t?.quick_guide || null,
        bestFor: t?.best_for || null,
      },
    };
  });
}

/* Hàm quan trọng: Chuyển đổi JSON phản hồi từ Bot (mới hoặc lịch sử) 
  thành mảng các message UI (Lời dẫn -> Thẻ Tool -> Bảng so sánh -> Kết luận)
*/
function processBotResponse(data, dateStr) {
  // Case 1: Bot trả lời chat thường (text)
  if (data?.mode === "chat") {
    return [{
      role: "assistant",
      content: data.reply || "Xin lỗi, mình chưa có câu trả lời phù hợp.",
      date: dateStr,
    }];
  }

  // Case 2: Bot trả lời gợi ý tool (structure)
  const uiMessages = [];
  const tools = Array.isArray(data?.recommended_tools) ? data.recommended_tools : [];
  const mappedTools = mapToolsForUI(tools);

  // 1. Lời dẫn (Intro)
  if (data?.intro) {
    uiMessages.push({
      role: "assistant",
      type: "preface",
      content: data.intro,
      date: dateStr,
    });
  }

  // 2. Các thẻ gợi ý (Suggestion Cards)
  if (mappedTools.length > 0) {
    uiMessages.push({
      role: "assistant",
      type: "suggestionRow",
      payload: mappedTools,
      date: dateStr,
    });
  }

  // 3. Bảng so sánh (Comparison Table)
  if (Array.isArray(data?.comparison) && data.comparison.length) {
    uiMessages.push({
      role: "assistant",
      type: "preface",
      content: "**So sánh nhanh giữa các lựa chọn:**",
      date: dateStr,
    });
    uiMessages.push({
      role: "assistant",
      type: "comparisonTable",
      tools: mappedTools,
      comparisons: data.comparison,
      date: dateStr,
    });
  }

  // 4. Kết luận (Recommendation)
  if (Array.isArray(data?.final_recommendation) && data.final_recommendation.length) {
    uiMessages.push({
      role: "assistant",
      type: "preface",
      content: "**Kết luận nhanh:**",
      date: dateStr,
    });
    uiMessages.push({
      role: "assistant",
      content: data.final_recommendation.join("\n\n"),
      date: dateStr,
    });
  }

  // 5. Các bước tiếp theo (Next Steps)
  if (Array.isArray(data?.next_steps) && data.next_steps.length) {
    uiMessages.push({
      role: "assistant",
      type: "preface",
      content: "**Các bước tiếp theo bạn có thể làm:**",
      date: dateStr,
    });
    uiMessages.push({
      role: "assistant",
      content: data.next_steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
      date: dateStr,
    });
  }

  return uiMessages;
}

// --- COMPONENTS ---

/* Header: Thêm nút History */
function Header({ onBackToIntro, onReset, onScrollToBottom, onOpenHistory }) {
  return (
    <header className="sticky top-0 z-20">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-5">
        <div className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-5 py-3">

          <button
            onClick={onBackToIntro}
            className="absolute left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110"
            title="Trở về trang giới thiệu"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <span
            onClick={onScrollToBottom}
            className="font-semibold tracking-wide text-white text-center cursor-pointer hover:text-pink-400 transition"
            title="Cuộn xuống cuối đoạn chat"
          >
            ChatBot AI gợi ý công cụ học tập
          </span>

          <div className="absolute right-4 flex items-center gap-3">
            {/* Button History */}
            <button
              onClick={onOpenHistory}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition hover:scale-110 border border-white/20"
              title="Lịch sử hội thoại"
            >
              <History className="w-5 h-5 text-white" />
            </button>

            {/* Button Reset/New */}
            <button
              onClick={onReset}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="Tạo cuộc hội thoại mới"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

/* Khối Welcome */
function Welcome({ onExampleClick }) {
  const examples = [
    "Tôi muốn lên kế hoạch nội dung và đăng bài tự động",
    "Có app nào kết hợp lịch, việc và ghi chú không?",
    "Công cụ nào giúp tôi quản lý thời gian hiệu quả?",
  ];
  return (
    <div className="rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-center gap-4 mb-2">
        <img src={logoImage} alt="Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
        <h2 className="text-2xl font-semibold text-white">Xin chào bạn!</h2>
      </div>
      <p className="text-sm text-white/80">
        Hãy đưa ra những yêu cầu trong học tập hay làm việc của bạn. 
        Mình sẽ đề xuất những công cụ hữu ích trên Internet, 
        kèm các bước hướng dẫn sử dụng, để đáp ứng nhu cầu của bạn.
      </p>
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

// --- MAIN PAGE ---

export default function ChatPage() {
  const navigate = useNavigate();

  // 1. QUẢN LÝ ID (User & Session)
  // UserID: Lưu trong localStorage để nhớ người dùng
  const [userId] = useState(() => {
    let uid = localStorage.getItem("chatbot_user_id");
    if (!uid) {
      uid = uuidv4();
      localStorage.setItem("chatbot_user_id", uid);
    }
    return uid;
  });

  // Xử lý đổi tên
  const handleRenameSession = async (sid, newTitle) => {
    try {
      await renameSession(sid, newTitle);
      // Load lại danh sách history để cập nhật tên mới
      const list = await getUserSessions(userId);
      setSessions(list);
    } catch (e) {
      console.error("Lỗi đổi tên:", e);
    }
  };

  // Xử lý xóa 1 hội thoại
  const handleDeleteSession = async (sid) => {
    if (!confirm("Bạn muốn xóa cuộc hội thoại này?")) return;
    
    try {
      await deleteSession(sid);
      
      // Nếu xóa đúng cái đang mở -> Reset về trang trắng
      if (sid === sessionId) {
        handleCreateNew();
      } else {
        // Nếu xóa cái khác -> Chỉ cần load lại danh sách
        const list = await getUserSessions(userId);
        setSessions(list);
      }
    } catch (e) {
      console.error("Lỗi xóa:", e);
    }
  };

  // SessionID: Mặc định tạo mới mỗi khi tải lại trang (hoặc có thể lưu nếu muốn)
  const [sessionId, setSessionId] = useState(() => uuidv4());

  // 2. STATE GIAO DIỆN
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State Modal History
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);

  // State Modal Detail Tool
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [prefillText, setPrefillText] = useState("");
  const [errorText, setErrorText] = useState("");

  // Refs
  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);
  const hasMessages = useMemo(() => messages.length > 0, [messages]);
  const suggestionAnchorRef = useRef(null);
  const [shouldScrollToSuggestion, setShouldScrollToSuggestion] = useState(false);

  // --- EFFECT ---

  // Auto-scroll logic
  function scrollToBottom(behavior = "smooth") {
    window.scrollTo({ top: document.body.scrollHeight, behavior });
  }

  useEffect(() => {
    if (loading) scrollToBottom("smooth");
  }, [loading]);

  useEffect(() => {
    if (!shouldScrollToSuggestion) return;
    const el = suggestionAnchorRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const HEADER_OFFSET = 220;
      const targetY = window.scrollY + rect.top - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
    setShouldScrollToSuggestion(false);
  }, [shouldScrollToSuggestion, messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // --- HANDLERS LỊCH SỬ ---

  // Mở modal & Load danh sách
  const handleOpenHistory = async () => {
    setShowHistory(true);
    try {
      const list = await getUserSessions(userId);
      setSessions(list);
    } catch (e) {
      console.error("Error loading sessions:", e);
    }
  };

  // Tạo mới cuộc trò chuyện
  const handleCreateNew = () => {
    setSessionId(uuidv4());
    setMessages([]);
    setShowHistory(false);
    setErrorText("");
  };

  // Chọn một cuộc trò chuyện cũ
  const handleSelectSession = async (sid) => {
    if (sid === sessionId) {
      setShowHistory(false);
      return;
    }
    
    setLoading(true);
    setShowHistory(false);
    setMessages([]); // Xóa tạm
    setErrorText("");

    try {
      setSessionId(sid);
      // Lấy dữ liệu thô từ DB
      const historyData = await getSessionHistory(sid);
      
      // Tái tạo lại giao diện từ dữ liệu DB
      const reconstructedMessages = [];

      historyData.forEach(msg => {
        // Lấy thời gian thực từ tin nhắn cũ
        const msgTime = formatTimeFromISO(msg.timestamp); 
        const msgDate = formatDateFromISO(msg.timestamp);

        if (msg.role === 'user') {
          reconstructedMessages.push({
            role: 'user',
            content: msg.content,
            date: msgDate,
            time: msgTime
          });
        } else if (msg.role === 'assistant') {
          // Xử lý nội dung của bot (có thể là text hoặc json object)
          const botContent = typeof msg.content === 'string' 
             ? { mode: 'chat', reply: msg.content } // Nếu db lưu string cũ
             : msg.content; // Nếu db lưu json mới
          
          const uiMsgs = processBotResponse(botContent, msgDate);
          reconstructedMessages.push(...uiMsgs);
        }
      });

      setMessages(reconstructedMessages);
      requestAnimationFrame(() => scrollToBottom("instant")); // Scroll ngay lập tức
    } catch (e) {
      console.error("Error restoring session:", e);
      setErrorText("Không thể tải lại cuộc trò chuyện này.");
    } finally {
      setLoading(false);
    }
  };

  // Xóa tất cả
  const handleDeleteAll = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không?")) return;
    try {
      await deleteAllHistory(userId);
      setSessions([]);
      handleCreateNew();
    } catch (e) {
      alert("Xóa thất bại!");
    }
  };

  // Hàm dừng bot
  function handleStopBot() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "Đã dừng phản hồi.", date: getTodayLabel() },
    ]);
  }

  // --- HÀM GỬI TIN NHẮN (Core Logic) ---
  function addUserMessage(text) {
    if (!text || !text.trim()) return;

    const nowISO = new Date().toISOString();
    const timeStr = formatTimeFromISO(nowISO);
    const dateStr = getTodayLabel();

    // 1. Thêm tin nhắn user vào UI ngay
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text.trim(), time: timeStr, date: dateStr },
    ]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    // 2. Chuẩn bị gọi API
    abortControllerRef.current = new AbortController();
    setErrorText("");
    setLoading(true);

    // 3. Gọi Backend với UserID và SessionID
    askTools(text.trim(), sessionId, userId, abortControllerRef.current.signal)
      .then((data) => {
        // 4. Xử lý phản hồi bằng hàm helper dùng chung
        const uiMsgs = processBotResponse(data, dateStr);
        
        // Thêm vào state
        setMessages((prev) => [...prev, ...uiMsgs]);
        
        // Nếu là tool suggestion thì trigger scroll
        if (data?.mode !== "chat") {
          setShouldScrollToSuggestion(true);
        } else {
          requestAnimationFrame(() => scrollToBottom("smooth"));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error(err);
        setErrorText("Không thể kết nối với máy chủ.");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Xin lỗi, đã xảy ra lỗi kết nối.", date: dateStr },
        ]);
      })
      .finally(() => {
        setLoading(false);
        abortControllerRef.current = null;
      });
  }

  // --- RENDER ---
  return (
    <div className="min-h-dvh flex flex-col bg-[#0b0f16] text-white">
      {/* Background Effects */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_0%_100%,rgba(236,72,153,0.18)_0%,transparent_55%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(124,58,237,0.12)_0%,transparent_55%)]" />

      {/* Header */}
      <Header
        onBackToIntro={() => navigate('/')}
        onReset={handleCreateNew}
        onScrollToBottom={() => scrollToBottom("smooth")}
        onOpenHistory={handleOpenHistory}
      />

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="relative z-10 flex-1 overflow-y-auto pb-40"
        ref={scrollRef}
      >
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-6">
          <div className="mx-auto w-full max-w-3xl">
            
            {!hasMessages && (
              <div className="mb-6">
                <Welcome onExampleClick={(text) => setPrefillText(text)} />
              </div>
            )}

            {/* Render List Messages */}
            {(() => {
              let lastDate = null;
              const lastSuggestionIndex = messages.reduceRight(
                (acc, msg, index) => (acc === -1 && msg.type === "suggestionRow" ? index : acc), -1
              );

              return messages.map((m, idx) => {
                const showDate = m.date && m.date !== lastDate;
                if (showDate) lastDate = m.date;

                const dateSeparator = showDate ? (
                  <div key={`date-${idx}`} className="flex items-center my-4">
                    <div className="flex-grow border-t border-white/10" />
                    <span className="mx-3 text-xs text-gray-400 whitespace-nowrap">{m.date}</span>
                    <div className="flex-grow border-t border-white/10" />
                  </div>
                ) : null;

                // Render các loại tin nhắn đặc biệt
                if (m.type === "preface") {
                  return <><div key={`sep-${idx}`}>{dateSeparator}</div><ChatMessage key={idx} role="assistant">{m.content}</ChatMessage></>;
                }

                if (m.type === "suggestionRow") {
                  const items = m.payload || [];
                  const isLatest = idx === lastSuggestionIndex;
                  return (
                    <div key={idx}>
                      {dateSeparator}
                      <div className="w-full my-3" ref={isLatest ? suggestionAnchorRef : null}>
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
                    </div>
                  );
                }

                if (m.type === "comparisonTable") {
                  return (
                    <div key={idx}>
                      {dateSeparator}
                      <div className="w-full my-3">
                        <ComparisonTable tools={m.tools || []} comparisonTexts={m.comparisons || []} />
                      </div>
                    </div>
                  );
                }

                // Render tin nhắn thường
                return (
                  <div key={idx}>
                    {dateSeparator}
                    <ChatMessage role={m.role} time={m.time}>
                      {m.content}
                    </ChatMessage>
                  </div>
                );
              });
            })()}

            {/* Loading Indicator */}
            {loading && (
              <ChatMessage role="assistant">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400">Đang xử lí yêu cầu của bạn</span>
                  <div className="flex items-end space-x-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce" />
                  </div>
                </div>
              </ChatMessage>
            )}

            {/* Error Message */}
            {!!errorText && <ChatMessage role="assistant">Lỗi: {errorText}</ChatMessage>}
          </div>
        </div>
      </motion.main>

      {/* Input Area */}
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

      {/* Modals */}
      <ToolModal
        open={!!activeSuggestion}
        title={activeSuggestion?.title}
        iconUrl={activeSuggestion?.favicon}
        link={activeSuggestion?.link}
        summary={activeSuggestion?.summary}
        details={activeSuggestion?.details}
        bestFor={activeSuggestion?.details?.bestFor}
        onClose={() => setActiveSuggestion(null)}
      />

      <HistoryModal
        open={showHistory}
        sessions={sessions}
        currentSessionId={sessionId}
        onClose={() => setShowHistory(false)}
        onSelectSession={handleSelectSession}
        onCreateNew={handleCreateNew}
        onDeleteAll={handleDeleteAll}
        onRename={handleRenameSession} 
        onDelete={handleDeleteSession}
      />
    </div>
  );
}