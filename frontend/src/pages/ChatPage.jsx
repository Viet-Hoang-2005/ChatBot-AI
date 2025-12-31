import { useEffect, useMemo, useRef, useState } from "react"; // React core
import { ChevronLeft, History, Plus, User } from "lucide-react"; // Icons
import { motion } from "framer-motion"; // Animation
import { useNavigate, useParams } from "react-router-dom"; // Hook quản lý điều hướng
import { v4 as uuidv4 } from 'uuid'; // Tạo UUID cho User ID và Session ID

// Import các API functions giao tiếp với backend
import { askTools, getUserSessions, deleteAllHistory, getSessionHistory, 
  renameSession, deleteSession, 
  getUserProfile, saveUserProfile, deleteUserProfile} from "../lib/api.js";

// Import các component con
import ChatMessage from "../components/ChatMessage.jsx";
import MessageInput from "../components/MessageInput.jsx";
import SuggestionCard from "../components/SuggestionCard.jsx";
import ComparisonTable from "../components/ComparisonTable.jsx";
import ToolModal from "../components/ToolModal.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import HistoryModal from "../components/HistoryModal.jsx";
import logoImage from '../assets/logo.png';

/* 1. CÁC HÀM XỬ LÝ DỮ LIỆU (HELPER FUNCTIONS) */
// Lấy nhãn ngày và giờ hôm nay theo định dạng VN
function getDateTodayLabel() {
  return new Date().toLocaleDateString("vi-VN", {
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric", 
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
function getTimeTodayLabel() {
  return new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

// Chuyển đổi chuỗi thời gian từ DB (ISO) sang giờ VN (HH:MM)
function formatTimeFromISO(isoString) {
  if (!isoString) return "";
  
  // Tự động thêm 'Z' nếu thiếu để đảm bảo trình duyệt hiểu là giờ UTC
  const safeIsoString = (isoString.endsWith("Z") || isoString.includes("+")) ? isoString : isoString + "Z";
  const date = new Date(safeIsoString);
  
  return date.toLocaleTimeString("vi-VN", { 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: "Asia/Ho_Chi_Minh", 
  });
}

// Chuyển đổi chuỗi thời gian từ DB (ISO) sang ngày VN (dd/mm/yyyy)
function formatDateFromISO(isoString) {
  if (!isoString) return getDateTodayLabel();
  
  const safeIsoString = (isoString.endsWith("Z") || isoString.includes("+")) ? isoString : isoString + "Z";
  
  return new Date(safeIsoString).toLocaleDateString("vi-VN", {
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric", 
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

// Chuyển đổi danh sách tool nhận từ API để xử lí UI
function mapToolsForUI(tools = []) {
  return tools.slice(0, 3).map((t) => {
    // Tạo link favicon từ google service
    const favicon = t?.url
      ? `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(t.url)}&size=64`
      : null;

    // Trả về object chuẩn cho UI
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
        ].filter(Boolean), // Lọc bỏ các dòng null/undefined
        advantages: t?.advantages || null,
        disadvantages: t?.disadvantages || null,
        quickGuide: t?.quick_guide || null,
        bestFor: t?.best_for || null,
      },
    };
  });
}

// Xử lý phản hồi từ Bot và trả về mảng các Message UI để render
function processBotResponse(data, dateStr) {
  // Trường hợp 1: Bot trả lời chat thường (text)
  if (data?.mode === "chat") {
    return [{
      role: "assistant",
      content: data.reply || "Xin lỗi, mình chưa có câu trả lời phù hợp.",
      date: dateStr,
    }];
  }

  // Trường hợp 2: Bot trả lời gợi ý (Structure JSON)
  const uiMessages = [];
  const tools = Array.isArray(data?.recommended_tools) ? data.recommended_tools : [];
  const mappedTools = mapToolsForUI(tools);

  // 1. Lời dẫn
  if (data?.intro) 
    uiMessages.push({ role: "assistant", type: "preface", content: data.intro, date: dateStr });
  
  // 2. Thẻ gợi ý tool
  if (mappedTools.length > 0) 
    uiMessages.push({ role: "assistant", type: "suggestionRow", payload: mappedTools, date: dateStr });
  
  // 3. Bảng so sánh
  if (Array.isArray(data?.comparison) && data.comparison.length) {
    uiMessages.push({ role: "assistant", type: "preface", content: "**So sánh nhanh:**", date: dateStr });
    uiMessages.push({ role: "assistant", type: "comparisonTable", tools: mappedTools, comparisons: data.comparison, date: dateStr });
  }

  // 4. Kết luận & Bước tiếp theo
  if (Array.isArray(data?.final_recommendation) && data.final_recommendation.length) {
    uiMessages.push({ role: "assistant", type: "preface", content: "**Kết luận nhanh:**", date: dateStr });
    uiMessages.push({ role: "assistant", content: data.final_recommendation.join("\n\n"), date: dateStr });
  }
  if (Array.isArray(data?.next_steps) && data.next_steps.length) {
    uiMessages.push({ role: "assistant", type: "preface", content: "**Các bước tiếp theo:**", date: dateStr });
    uiMessages.push({ role: "assistant", content: data.next_steps.map((s, i) => `${i + 1}. ${s}`).join("\n"), date: dateStr });
  }

  return uiMessages;
}

/* 2. CÁC COMPONENT CON (UI) */
// Header của trang Chat
function Header({ title, onBackToIntro, onReset, onScrollToBottom, onOpenHistory, onOpenProfile }) {
  return (
    <header className="sticky top-0 z-20">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-5">
        <div className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 backdrop-blur-xl px-5 py-3">
          {/* Button quay lại IntroPage */}
          <button 
            onClick={onBackToIntro} 
            title="Quay lại"
            className="absolute left-4 w-9 h-9 rounded-full 
              bg-white/10 hover:bg-white/20 border border-white/20 
              flex items-center justify-center transition will-change-transform hover:scale-110">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          {/* Tiêu đề */}
          <span 
            onClick={onScrollToBottom} 
            className="font-semibold text-white cursor-pointer hover:text-pink-400 transition-colors truncate max-w-[40%] sm:max-w-[50%] text-center">
              {title || "ChatBot AI gợi ý công cụ học tập"}
          </span>
          
          <div className="absolute right-4 flex items-center gap-3">
            {/* Button thông tin cá nhân */}
            <button 
              onClick={onOpenProfile} 
              title="Thông tin cá nhân" 
              className="w-9 h-9 rounded-full 
                bg-white/10 hover:bg-white/20 border border-white/20 
                flex items-center justify-center transition will-change-transform hover:scale-110">
              <User className="w-5 h-5 text-white" />
            </button>
            
            {/* Button lịch sử hội thoại */}
            <button 
              onClick={onOpenHistory}
              title="Lịch sử trò chuyện" 
              className="w-9 h-9 rounded-full 
                bg-white/10 hover:bg-white/20 border border-white/20 
                flex items-center justify-center transition will-change-transform hover:scale-110">
              <History className="w-5 h-5 text-white" />
            </button>
            
            {/* Button tạo hội thoại mới */}
            <button 
              onClick={onReset} 
              title="Tạo cuộc trò chuyện mới" 
              className="w-9 h-9 rounded-full 
                bg-white/10 hover:bg-white/20 border border-white/20 
                flex items-center justify-center transition will-change-transform hover:scale-110">
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Khối chào mừng khi bắt đầu cuộc trò chuyện mới
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
        <h2 className="text-2xl font-semibold text-white">
          Xin chào bạn!
        </h2>
      </div>
      <p className="text-sm text-white/80">
        Hãy đưa ra những yêu cầu trong học tập hay làm việc của bạn. 
        Mình sẽ đề xuất những công cụ hữu ích trên Internet, kèm các bước hướng dẫn sử dụng, để đáp ứng nhu cầu của bạn.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {examples.map((ex, i) => (
          <button key={i} 
            onClick={() => onExampleClick(ex)} 
            className="text-left text-sm px-3 py-2 rounded-xl 
              border border-white/10 bg-white/5 hover:bg-white/10 text-white/90">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

/* 3. MAIN PAGE (LOGIC CHÍNH) */
// Hàm xử lý trang Chat chính
export default function ChatPage() {
  const navigate = useNavigate(); // Hook điều hướng URL
  const { id } = useParams(); // Lấy ID từ URL (VD: /chat/123 -> id = 123)

  /* A. QUẢN LÝ STATE CHUNG */
  // Session ID: Ưu tiên lấy từ URL, nếu không có thì tạo ID tạm
  const [sessionId, setSessionId] = useState(() => id || uuidv4());
  
  // State dữ liệu
  const [messages, setMessages] = useState([]); // Mảng tin nhắn trong cuộc hội thoại
  const [loading, setLoading] = useState(false); // State loading khi chờ phản hồi từ Bot
  const [isHistoryLoading, setIsHistoryLoading] = useState(false); // Loading cho History Modal
  const [isProfileLoading, setIsProfileLoading] = useState(false); // Loading cho Profile Modal
  const [errorText, setErrorText] = useState(""); // Text lỗi chung

  // State UI Modals
  const [showHistory, setShowHistory] = useState(false); // Hiện/ẩn lịch sử hội thoại
  const [sessions, setSessions] = useState([]); // Danh sách các session
  const currentSession = sessions.find(s => s.session_id === sessionId);
  const [activeSuggestion, setActiveSuggestion] = useState(null); // Tool đang mở Modal chi tiết
  const [prefillText, setPrefillText] = useState(""); // Text mẫu để điền sẵn vào Input

  // State Profile Modal
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Refs hỗ trợ scroll và abort request
  const abortControllerRef = useRef(null); // Ref để hủy request khi cần
  const scrollRef = useRef(null); // Ref để scroll tới cuối trang
  const hasMessages = useMemo(() => messages.length > 0, [messages]); // Kiểm tra có tin nhắn hay không
  const suggestionAnchorRef = useRef(null); // Ref để scroll tới khối gợi ý
  const [shouldScrollToSuggestion, setShouldScrollToSuggestion] = useState(false); // State trigger scroll tới gợi ý

  /* B. LOGIC ROUTER */
  // 0. Tự động khởi tạo Session (Cấp Cookie) nếu chưa có khi vào trang Chat
  useEffect(() => {
    const ensureSession = async () => {
      try {
        await initSession(); // Gọi API để Backend set cookie nếu chưa có
        // Sau khi đảm bảo có cookie thì mới load danh sách session cũ
        const list = await getUserSessions();
        setSessions(list);
      } catch (e) {
        console.error("Lỗi khởi tạo session:", e);
      }
    };
    ensureSession();
  }, []);
  
  // 1. Hàm load dữ liệu từ API
  const loadSessionData = async (sid) => {
    setLoading(true); 
    setShowHistory(false); 
    setMessages([]); 
    setErrorText("");
    
    try {
      const historyData = await getSessionHistory(sid); // Goi API lấy lịch sử
      const reconstructed = [];
      
      // Duyệt qua từng tin nhắn trong lịch sử
      historyData.forEach(msg => {
        // Định dạng lại thời gian
        const msgTime = formatTimeFromISO(msg.timestamp);
        const msgDate = formatDateFromISO(msg.timestamp);
        
        // Push tin nhắn user vào mảng tái cấu trúc
        if (msg.role === 'user') {
          reconstructed.push({ 
            role: 'user', 
            content: msg.content, 
            date: msgDate, 
            time: msgTime });
        } 
        else {
          // Xử lý nội dung bot (có thể là string hoặc json object)
          const content = typeof msg.content === 'string' ? {
            mode: 'chat', 
            reply: msg.content 
          } : msg.content;
          
          reconstructed.push(...processBotResponse(content, msgDate)); // Push các tin nhắn bot đã xử lý vào mảng tái cấu trúc
        }
      });
      setMessages(reconstructed); // Cập nhật state messages với mảng tái cấu trúc
      if (reconstructed.length > 0) {
        requestAnimationFrame(() => scrollToBottom("instant"));
      }
    } 
    catch (e) {
      console.error("Lỗi tải hội thoại:", e);
      navigate('/chat'); // Nếu ID lỗi -> Về trang chủ
    } 
    finally {
      setLoading(false); // Kết thúc loading
    }
  };

  // 2. Hàm reset giao diện về trạng thái mới
  const resetToNewSession = () => {
    const newId = uuidv4();
    setSessionId(newId);
    setMessages([]);
    setShowHistory(false);
    setErrorText("");
  };

  // 3. Effect: Khi URL thay đổi -> Quyết định Load cũ hay Reset mới
  useEffect(() => {
    const syncWithUrl = async () => {
      // Nếu URL có ID hội thoại (/chat/abc)  
      if (id) {
        // Nếu URL chứa ID trùng với Session hiện tại và đã có tin nhắn -> Không load dữ liệu từ server
        if (id === sessionId && messages.length > 0) {
            return; 
        }  

        //  Nếu URL chứa ID khác Session hiện tại -> Load dữ liệu
        if (id !== sessionId) setSessionId(id);
        await loadSessionData(id);
      }
      
      // URL không có ID (/chat): Reset về trang trắng
      else { 
        // Chỉ reset nếu đang hiển thị tin nhắn cũ
        if (messages.length > 0) {
            resetToNewSession();
        }
      }
  };
    syncWithUrl(); // Gọi hàm đồng bộ với URL
  }, [id]); // Chạy lại mỗi khi ID thay đổi

  // 4. Effect: Vào trang lần đầu -> Load danh sách History để nạp vào Modal
  useEffect(() => {
    const initData = async () => {
        try {
            const list = await getUserSessions(); // Gọi API lấy danh sách session
            setSessions(list); // Cập nhật state sessions
        } catch (e) { 
          console.error(e); 
        }
    };
    initData();
  }, []);

  // 5. Load Profile từ Server khi vào trang
  useEffect(() => {
    setIsProfileLoading(true); 
    getUserProfile().then(data => {
      if (data) setUserProfile(data);
    }).finally(() => {
      setIsProfileLoading(false); 
    });
  }, []);
  
  /* C. CÁC HÀM TƯƠNG TÁC (HANDLERS) */
  // 1. Xử lý tạo mới -> Chỉ cần đổi URL về /chat
  const handleCreateNew = () => {
    navigate('/chat');
  };

  // 2. Xử lý chọn lịch sử -> Chỉ cần đổi URL sang /chat/:id
  const handleSelectSession = (sid) => {
    if (sid === id) { // Nếu đang ở đúng trang đó thì chỉ đóng modal
        setShowHistory(false);
        return;
    }
    navigate(`/chat/${sid}`);
  };

  // 3. Xử lý gửi tin nhắn từ User
  function addUserMessage(text) {
    if (!text?.trim()) return; // Bỏ qua nếu tin nhắn rỗng
    
    // Nếu đang ở trang Chat chủ, cập nhật URL sang ID mới
    if (!id) {
        navigate(`/chat/${sessionId}`, { replace: true });
    }

    // Lấy ngày và giờ hiện tại
    const nowStr = getDateTodayLabel();
    const timeStr = getTimeTodayLabel();
    
    // Thêm tin nhắn user vào UI ngay lập tức
    setMessages(prev => [...prev, { role: "user", content: text.trim(), time: timeStr, date: nowStr }]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setErrorText("");

    // Gọi API gửi tin nhắn và nhận phản hồi từ Bot
    askTools(text.trim(), sessionId, abortControllerRef.current.signal)
      .then(data => {
        const uiMsgs = processBotResponse(data, nowStr); // Xử lý phản hồi từ Bot thành các tin nhắn UI
        setMessages(prev => [...prev, ...uiMsgs]); // Cập nhật state messages với các tin nhắn từ Bot
        
        // Tự động cuộn xuống theo trường hợp phản hồi của bot
        if (data?.mode !== "chat")
          setShouldScrollToSuggestion(true);
        else 
          requestAnimationFrame(() => scrollToBottom("smooth"));
      })
      .catch(err => {
        // Nếu lỗi do hủy request thì thông báo đã dừng
        if (err.name === 'AbortError') {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "Đã dừng phản hồi theo yêu cầu của bạn!", 
            date: nowStr 
          }]);
        } 
        // Nếu lỗi do mạng hoặc Server
        else {
          setErrorText("Lỗi kết nối.");
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "Đã xảy ra lỗi kết nối.", 
            date: nowStr 
          }]);
        }
      })
      .finally(() => setLoading(false));
  }

  // 4. Xử lý dừng phản hồi từ Bot
  function handleStopBot() {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setLoading(false);
  }

  // 5. Các hàm xử lý History và Session
  const handleOpenHistory = async () => {
    setShowHistory(true);
    setIsHistoryLoading(true); // Bắt đầu loading
    try { 
      // Lấy lại danh sách session mới nhất
      const list = await getUserSessions();
      setSessions(list);
    } 
    catch (e) { console.error(e); }
    finally {
      setIsHistoryLoading(false); // Kết thúc loading
    }
  };
  const handleDeleteAll = async () => {
    if (!confirm("Xóa tất cả lịch sử?")) return;
    await deleteAllHistory(); // Gọi API xóa lịch sử
    setSessions([]);
    navigate('/chat'); // Về trang Chat chính
  };

  const handleRenameSession = async (sid, newTitle) => {
    try {
      await renameSession(sid, newTitle); // Gọi API đổi tên session
      const list = await getUserSessions(); // Lấy lại danh sách session mới
      setSessions(list); // Cập nhật state sessions
    } catch (e) {}
  };

  const handleDeleteSession = async (sid) => {
    if (!confirm("Xóa cuộc hội thoại này?")) return;
    try {
      await deleteSession(sid);
      if (sid === id) navigate('/chat'); // Nếu xóa trang hiện tại -> Về trang chủ
      else { // Ngược lại chỉ cần load lại danh sách session
        const list = await getUserSessions();
        setSessions(list);
      }
    } catch (e) {}
  };

  // 6. Hàm Lưu Profile
  const handleSaveProfile = async (data) => {
    try {
      // Cập nhật UI ngay lập tức
      setUserProfile(data);
      setShowProfile(false); 
      
      // Gửi xuống Server lưu vào DB
      await saveUserProfile(data);
      console.log("Đã lưu profile lên DB");
    } catch (e) {
      console.error("Lỗi khi lưu profile:", e);
      alert("Có lỗi khi lưu thông tin, vui lòng thử lại.");
    }
  };

  // 7. Hàm Xóa Profile
  const handleDeleteProfile = async () => {
    try {
      setUserProfile(null); // Xóa UI
      await deleteUserProfile(); // Xóa DB
      console.log("Đã xóa profile trên DB");
    } catch (e) {
      console.error("Lỗi khi xóa profile:", e);
    }
  };

  /* 4. CÁC HÀM XỬ LÝ GIAO DIỆN */
  // Hàm cuộn trang xuống cuối
  const scrollToBottom = (behavior = "smooth") => {
    window.scrollTo({ top: document.body.scrollHeight, behavior });
  };

  // Effect: Mỗi khi loading thay đổi -> Cuộn xuống cuối trang
  useEffect(() => { 
    if (loading && messages.length > 0) {
      scrollToBottom("smooth"); 
    }
  }, [loading, messages.length]);
  
  // Effect: Cuộn tới khối gợi ý
  useEffect(() => {
    if (!shouldScrollToSuggestion) return;
    const el = suggestionAnchorRef.current;
    if (el) {
      const targetY = window.scrollY + el.getBoundingClientRect().top - 220;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
    setShouldScrollToSuggestion(false);
  }, [shouldScrollToSuggestion, messages]);

  // Tiêu đề Header
  const headerTitle = currentSession ? currentSession.title : "ChatBot AI gợi ý công cụ học tập";

  /* 5. RENDER UI CHÍNH */
  return (
    <div className="min-h-dvh flex flex-col bg-[#0b0f16] text-white">
      {/* Hiệu ứng nền */}
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_0%_100%,rgba(236,72,153,0.18)_0%,transparent_55%)]" />
      <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(124,58,237,0.12)_0%,transparent_55%)]" />

      {/* Header */}
      <Header
        title={headerTitle} 
        onBackToIntro={() => navigate('/')} 
        onReset={handleCreateNew} 
        onScrollToBottom={() => scrollToBottom("smooth")} 
        onOpenHistory={handleOpenHistory} 
        onOpenProfile={() => setShowProfile(true)}
      />

      {/* Vùng chat chính */}
      <div className="relative z-10 flex-1 pb-40" ref={scrollRef}>
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-6">
          <div className="mx-auto w-full max-w-3xl">
            {/* Màn hình Welcome nếu chưa có tin nhắn */}
            {!hasMessages && (
              <motion.div 
                key={sessionId}
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-6"
              >
                <Welcome onExampleClick={setPrefillText} />
              </motion.div>
            )}

            {/* Render danh sách tin nhắn */}
            {messages.map((m, idx) => {
              const prevM = messages[idx-1];
              const showDate = m.date && (!prevM || m.date !== prevM.date);
              
              const separator = showDate ? (
                <div key={`sep-${idx}`} className="flex items-center my-4">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="mx-3 text-xs text-gray-400">{m.date}</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>
              ) : null;

              if (m.type === "suggestionRow") return (
                <div key={idx}>{separator}<div className="w-full my-3" ref={idx === messages.length-1 ? suggestionAnchorRef : null}><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{m.payload.map((s, i) => <SuggestionCard key={i} title={s.title} summary={s.summary} iconUrl={s.favicon} onOpen={() => setActiveSuggestion(s)} />)}</div></div></div>
              );
              if (m.type === "comparisonTable") return <div key={idx}>{separator}<div className="w-full my-3"><ComparisonTable tools={m.tools} comparisonTexts={m.comparisons} /></div></div>;
              if (m.type === "preface") return <div key={idx}>{separator}<ChatMessage role="assistant">{m.content}</ChatMessage></div>;

              return <div key={idx}>{separator}<ChatMessage role={m.role} time={m.time}>{m.content}</ChatMessage></div>;
            })}

            {/* Loading Indicator */}
            {loading && (
              <ChatMessage role="assistant">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400">Đang suy nghĩ</span>
                  <div className="flex items-end space-x-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-gray-300/80 animate-bounce" />
                  </div>
                </div>
              </ChatMessage>
            )}
            {errorText && <ChatMessage role="assistant">Lỗi {errorText}</ChatMessage>}
          </div>
        </div>
      </div>

      {/* Input chat */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-4">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <MessageInput onSend={addUserMessage} onStop={handleStopBot} prefill={prefillText} isLoading={loading} />
        </div>
      </div>

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
      
      <ProfileModal 
        open={showProfile}
        initialData={userProfile}
        onClose={() => setShowProfile(false)}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
        isLoading={isProfileLoading}
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
        isLoading={isHistoryLoading}
      />
    </div>
  );
}