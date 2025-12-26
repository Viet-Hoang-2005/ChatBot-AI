import { useEffect, useRef, useState } from 'react';
import { X, MessageSquare, Trash2, PlusCircle, Clock, Edit2, Check } from "lucide-react";

export default function HistoryModal({ 
  open, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onClose, 
  onDeleteAll, 
  onCreateNew,
  onRename,
  onDelete
}) {
  const dialogRef = useRef(null);
  
  // State quản lý việc đang sửa cái nào
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset state edit khi đóng/mở modal
  useEffect(() => {
    if (!open) setEditingId(null);
  }, [open]);

  if (!open) return null;

  const formatDate = (isoString) => {
    if (!isoString) return "";
    
    const safeIsoString = (isoString.includes("Z") || isoString.includes("+")) 
      ? isoString 
      : isoString + "Z";

    const date = new Date(safeIsoString);
    // Ép kiểu về múi giờ Việt Nam
    const dateStr = date.toLocaleDateString('vi-VN', {
      day: '2-digit', 
      month: '2-digit',
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh"
    });
    
    const timeStr = date.toLocaleTimeString('vi-VN', {
      hour:'2-digit', 
      minute:'2-digit',
      timeZone: "Asia/Ho_Chi_Minh"
    });

    return `${dateStr} ${timeStr}`;
  };

  // Bắt đầu sửa
  const startEditing = (e, session) => {
    e.stopPropagation(); // Chặn click vào item cha (không mở chat)
    setEditingId(session.session_id);
    setEditTitle(session.title || "");
  };

  // Lưu sửa
  const saveEditing = (e, sessionId) => {
    e.stopPropagation();
    onRename(sessionId, editTitle);
    setEditingId(null);
  };

  // Hủy sửa
  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Xóa item
  const deleteItem = (e, sessionId) => {
    e.stopPropagation();
    onDelete(sessionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div ref={dialogRef} className="relative z-10 w-full max-w-xl h-[80vh] flex flex-col bg-[#0f1218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Clock className="w-5 h-5 text-pink-500" />
            Lịch sử trò chuyện
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-3 right-3 w-8 h-8 rounded-full
                      bg-white/10 hover:bg-white/20 border border-white/10
                      flex items-center justify-center
                      will-change-transform 
                      transition duration-300 hover:scale-110"
            title="Đóng"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Danh sách */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
              Chưa có cuộc hội thoại nào
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.session_id}
                // Chuyển onClick từ button sang div bao ngoài để dễ xử lý layout
                onClick={() => onSelectSession(s.session_id)}
                className={`w-full px-4 py-3 rounded-xl border transition group flex items-center justify-between gap-3 cursor-pointer
                  ${s.session_id === currentSessionId 
                    ? 'bg-pink-500/10 border-pink-500/40' 
                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}`}
              >
                {/* Phần Trái: Thông tin (hoặc Input sửa) */}
                <div className="flex-1 min-w-0">
                  {editingId === s.session_id ? (
                    // Giao diện khi đang sửa
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Click vào input không trigger chọn chat
                      className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-pink-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if(e.key === 'Enter') saveEditing(e, s.session_id);
                        if(e.key === 'Escape') cancelEditing(e);
                      }}
                    />
                  ) : (
                    // Giao diện hiển thị bình thường
                    <>
                      <div className={`font-medium truncate text-sm ${s.session_id === currentSessionId ? 'text-pink-400' : 'text-gray-200'}`}>
                        {s.title || "Cuộc hội thoại mới"}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        {formatDate(s.updated_at)}
                      </div>
                    </>
                  )}
                </div>

                {/* Phần Phải: Các nút thao tác */}
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  {editingId === s.session_id ? (
                    // Nút Lưu / Hủy
                    <>
                      <button 
                        onClick={(e) => saveEditing(e, s.session_id)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        title="Lưu"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={cancelEditing}
                        className="p-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                        title="Hủy"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    // Nút Sửa / Xóa
                    <>
                      <button 
                        onClick={(e) => startEditing(e, s)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition"
                        title="Đổi tên"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => deleteItem(e, s.session_id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition"
                        title="Xóa hội thoại này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-white/5 grid grid-cols-2 gap-4">
          <button
            onClick={onDeleteAll}
            disabled={sessions.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Xóa tất cả
          </button>
          
          <button
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white transition text-sm font-medium shadow-lg shadow-blue-900/20"
          >
            Tạo hội thoại mới
          </button>
        </div>
      </div>
    </div>
  );
}