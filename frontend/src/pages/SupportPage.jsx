import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { motion } from "framer-motion";
import { Star, Send, Trash2, CheckCircle, AlertCircle, MessageSquare, TriangleAlert, User, Edit3 } from "lucide-react";
import { sendBugReport, sendReview, getReviews, getMyReview, deleteReview } from "../lib/api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

// Helper format ngày
const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function SupportPage() {
  /* 1. KHỞI TẠO CÁC STATE */
  // Lấy userId từ localStorage hoặc đánh dấu là "anonymous"
  const userId = localStorage.getItem("chatbot_user_id") || "anonymous";

  // State load dữ liệu
  const [isLoading, setIsLoading] = useState(true);

  // State cho Review
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);

  // State cho Report
  const [reportTitle, setReportTitle] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);

  // Load dữ liệu khi vào trang
  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Gọi song song cả 2 API để tiết kiệm thời gian
      const [list, myRev] = await Promise.all([
        getReviews(),
        getMyReview(userId)
      ]);

      // Cập nhật list cộng đồng
      setReviewsList(list);

      // Cập nhật đánh giá cá nhân
      if (myRev) {
        setRating(myRev.rating);
        setReviewComment(myRev.comment || "");
        setHasReviewed(true);
      } else {
        setHasReviewed(false);
        setRating(0);
        setReviewComment("");
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* 2. XỬ LÝ HANDLERS */
  // Xử lý gửi và cập nhật Đánh giá
  const handleSendReview = async () => {
    if (rating === 0) return alert("Vui lòng chọn số sao!");
    
    setIsReviewSubmitting(true);
    try {
      await sendReview({ rating, comment: reviewComment, user_id: userId });
      await loadAllData();
    } catch (e) {
      alert("Lỗi khi gửi đánh giá");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Xử lý xóa Đánh giá
  const handleDeleteReview = async () => {
    if (hasReviewed) {
      if (confirm("Bạn có chắc chắn muốn xóa đánh giá của mình?")) {
        setIsReviewSubmitting(true);
        try {
          await deleteReview(userId);
          await loadAllData();
        } catch (e) {
          alert("Lỗi khi xóa đánh giá");
        } finally {
          setIsReviewSubmitting(false);
        }
      }
    } else {
      setRating(0);
      setReviewComment("");
    }
  };

  // Xử lí gửi Báo lỗi bằng email cho Admin
  const handleSendReport = async () => {
    if (!reportTitle.trim() || !reportContent.trim()) return alert("Thiếu thông tin báo lỗi!");
    setIsReportSubmitting(true);
    setReportStatus(null);
    try {
      const res = await sendBugReport({ title: reportTitle, content: reportContent, user_id: userId });
      if (res.success) {
        setReportStatus("success");
        setReportTitle("");
        setReportContent("");
        setTimeout(() => setReportStatus(null), 3000);
      } else {
        setReportStatus("error");
      }
    } catch (e) {
      setReportStatus("error");
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const handleClearReport = () => {
    setReportTitle("");
    setReportContent("");
    setReportStatus(null);
  };

  return (
    <div className="min-h-dvh bg-[#0b0f16] text-white flex flex-col">
       <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_0%_100%,rgba(236,72,153,0.15)_0%,transparent_55%)]" />
       <div aria-hidden className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(124,58,237,0.1)_0%,transparent_55%)]" />

      <Header />

      <main className="flex-1 px-5 sm:px-8 pb-10 relative z-10 max-w-screen-2xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          
          {/* CỘT TRÁI */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Card 1: Đánh giá trải nghiệm */}
            <motion.div initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-[#0f1218]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl min-h-[300px] flex flex-col">

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Star className={hasReviewed ? "text-yellow-400 fill-yellow-400" : "text-yellow-400"} />
                  <h2 className="text-xl font-bold">
                    {hasReviewed ? "Đánh giá của bạn" : "Đánh giá trải nghiệm"}
                  </h2>
                </div>
                {hasReviewed && !isLoading && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Đã đăng</span>}
              </div>
              
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                   <LoadingSpinner message="Đang load dữ liệu..." size="md" color="white" />
                </div>
              ) : (
                <>
                  {/* Button 5 stars đánh giá */}
                  <div className="flex flex-col items-center gap-2 mb-4">  
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star size={32} className={`transition-colors ${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-yellow-400 h-5 font-medium">
                      {rating > 0 ? ["Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][rating - 1] : ""}
                    </span>
                  </div>

                  {/* Textarea điền nội dung đánh giá */}
                  <textarea
                    rows={2}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Bạn cảm thấy thế nào về Website? (Tùy chọn)"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none hover:border-blue-600/60 mb-4 resize-none"
                  />

                  {/* Button Xóa và Gửi đánh giá */}
                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={handleDeleteReview}
                      disabled={isReviewSubmitting}
                      className="flex flex-1 py-2 rounded-xl border border-white/10 bg-red-500/10 text-red-400 hover:bg-red-500/20 justify-center items-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} /> Xóa
                    </button>

                    <button
                      onClick={handleSendReview}
                      disabled={isReviewSubmitting}
                      className={"flex flex-[2] py-2 rounded-xl font-medium transition-colors disabled:opacity-50 justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:opacity-80 text-white"}
                    >
                      {isReviewSubmitting ? "..." : (
                        <>
                          <Edit3 size={16} />
                          <span>{hasReviewed ? "Cập nhật" : "Gửi đánh giá"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>

            {/* Card 2: Báo lỗi / Góp ý */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }} 
              className="bg-[#0f1218]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="text-red-500" />
                  <h2 className="text-xl font-bold">Báo lỗi / Góp ý</h2>
                </div>

                {/* Status báo lỗi */}
                {reportStatus === "success" ? (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-2">
                    <CheckCircle size={14} /> Gửi email thành công
                  </span>
                ) : reportStatus === "error" ? (
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded flex items-center gap-2">
                    <AlertCircle size={14} /> Lỗi gửi email
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                {/* Input tiêu đề báo lỗi */}
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Tiêu đề (Ví dụ: Lỗi hiển thị...)"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none hover:border-blue-600/60"
                />
                
                {/* Textarea nội dung báo lỗi */}
                <textarea
                  rows={4}
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none hover:border-blue-600/60 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={handleClearReport} 
                  className="flex-1 py-2 rounded-xl border border-white/10 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex justify-center items-center gap-2">
                  <Trash2 size={16} /> Xóa
                </button>
                <button 
                  onClick={handleSendReport} 
                  disabled={isReportSubmitting}
                  className="flex-[2] py-2 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 hover:opacity-80 text-white font-medium flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isReportSubmitting ? "..." : <><Send size={16} /> Gửi Admin</>}
                </button>
              </div>
            </motion.div>
          </div>

          {/* CỘT PHẢI */}
          <div className="h-full lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.5, ease: "easeOut" }} 
              className="h-full bg-[#0f1218]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
              
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="text-blue-500" />
                <h2 className="text-xl font-bold">Đánh giá từ cộng đồng</h2>
              </div>

              {/* Hiển thị Spinner hoặc List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative" style={{ maxHeight: '600px', minHeight: '200px' }}>
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner message="Đang tải danh sách..." size="lg" color="violet" />
                  </div>
                ) : reviewsList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                      Chưa có đánh giá nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviewsList.map((review, idx) => (
                      <div key={idx} className={`rounded-2xl p-4 border ${review.user_id === userId ? "bg-pink-500/10 border-pink-500/30" : "bg-white/5 border-white/5"}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 ${review.user_id === userId ? "bg-pink-500/20" : "bg-gradient-to-br from-pink-500/20 to-violet-500/20"}`}>
                              <User size={14} className="text-white/70" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white flex items-center gap-2">
                                  {review.user_name || "Anonymous"}
                                  {review.user_id === userId && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Tôi</span>}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-700"} />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-300 pl-10 border-l-2 border-white/10 ml-4 py-1">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}