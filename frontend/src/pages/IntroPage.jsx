import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import robotImg from "../assets/Background/robot-hands.png";

export default function IntroPage() {
  const navigate = useNavigate();

  // Cuộn lên đầu trang khi component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-dvh bg-[#0b0f16] text-white">
      {/* Canvas nền */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_0%_100%,rgba(236,72,153,0.28)_0%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(124,58,237,0.15)_0%,transparent_55%)]"
      />

      {/* Header chung */}
      <Header />

      {/* Card chính */}
      <main className="relative z-10">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 pb-10">
          <div className="relative grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-[#0f1218]/90 backdrop-blur shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
            {/* Panel trái: gradient hồng đậm ở dưới-trái */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative p-8 sm:p-12 lg:p-16 pl-12 bg-[radial-gradient(80%_70%_at_0%_100%,rgba(236,72,153,0.6)_0%,rgba(236,72,153,0.15)_35%,transparent_70%)] will-change-transform"
            >
              {/* Tiêu đề + mô tả */}
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-2">
                Cẩm nang số
              </h1>
              <h2 className="text-pink-400 text-2xl font-semibold mb-6">
                ChatBot AI gợi ý công cụ học tập
              </h2>
              <p className="text-base md:text-lg text-white/90 leading-7 max-w-xl mb-8">
                <span className="font-semibold">ChatBot AI </span>
                là một công cụ mạnh mẽ giúp sinh viên nhanh chóng tìm thấy các công cụ học tập trên Internet
                phù hợp với nhu cầu của mình. Hãy thử ngay!
              </p>

              {/* Nút Bắt đầu */}
              <button
                onClick={() => navigate("/chat")}
                className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xl rounded-xl px-8 py-3 shadow-[0_8px_24px_-8px_rgba(236,72,153,0.7)] transition"
              >
                Bắt đầu
              </button>
            </motion.div>

            {/* Panel phải: ảnh tay robot */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              className="relative flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-visible will-change-transform"
            >
              <img
                src={robotImg}
                alt="Robot holding phone"
                className="w-full h-auto object-contain max-w-[600px] md:max-w-[700px] lg:max-w-[800px] md:scale-100 lg:scale-110 rounded-3xl drop-shadow-2xl transition-transform"
              />
            </motion.div>

            {/* Tạo bóng mờ dưới card */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 -bottom-6 h-10 rounded-full bg-black/40 blur-2xl"
            />
          </div>
        </div>
      </main>
    </div>
  );
}