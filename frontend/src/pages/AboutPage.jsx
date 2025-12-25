import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header.jsx";

// Import ảnh
import anh1 from "../assets/Avatar/anh1.png";
import anh2 from "../assets/Avatar/anh2.png";
import anh3 from "../assets/Avatar/anh3.png";
import anh4 from "../assets/Avatar/anh4.png";
import anh5 from "../assets/Avatar/anh5.png";
import anh6 from "../assets/Avatar/anh6.png";
import anh7 from "../assets/Avatar/anh7.png";
import anh8 from "../assets/Avatar/anh8.png";
import anh9 from "../assets/Avatar/anh9.png";
import anh10 from "../assets/Avatar/anh10.png";

// Dữ liệu các ban và thành viên
const teams = [
  {
    name: "Ban Truyền Thông",
    members: [
      { id: 1, name: "Nguyễn Phương Quyên", mssv: "23521327", avatar: anh8 },
      { id: 2, name: "Đoàn An Minh", mssv: "23520921", avatar: anh2 },
      { id: 3, name: "Nguyễn Đức Duy", mssv: "24520386", avatar: anh3 },
      { id: 4, name: "Chu Thị Minh Ánh", mssv: "24520088", avatar: anh4 },
      { id: 5, name: "Nguyễn Lê Đức Huy", mssv: "24520680", avatar: anh6 },
    ],
  },
  {
    name: "Ban Thiết Kế",
    members: [
      { id: 1, name: "Nguyễn Phương Quyên", mssv: "23521327", avatar: anh8 },
      { id: 2, name: "Trần Nguyễn Việt Hoàng", mssv: "23520541", avatar: anh5 },
      { id: 3, name: "Dương Thị Tú Yến", mssv: "23521846", avatar: anh1 },
      { id: 4, name: "Chu Thị Minh Ánh", mssv: "24520088", avatar: anh4 },
    ],
  },
  {
    name: "Ban Code Web",
    members: [
      { id: 1, name: "Trần Nguyễn Việt Hoàng", mssv: "23520541", avatar: anh5 },
      { id: 2, name: "Dương Thị Tú Yến", mssv: "23521846", avatar: anh1 },
      { id: 3, name: "Nguyễn Lâm Bảo Phúc", mssv: "23521208", avatar: anh7 },
    ],
  },
  {
    name: "Ban Khảo Sát",
    members: [
      { id: 1, name: "Đoàn An Minh", mssv: "23520921", avatar: anh2 },
      { id: 2, name: "Trần Bảo Trân", mssv: "23521623", avatar: anh9 },
    ],
  },
  {
    name: "Ban Nội Dung",
    members: [
      { id: 1, name: "Hồ Nhật Thành", mssv: "23521439", avatar: anh10 },
      { id: 2, name: "Trần Bảo Trân", mssv: "23521623", avatar: anh9 },
      { id: 3, name: "Nguyễn Lê Đức Huy", mssv: "24520680", avatar: anh6 },
    ],
  },
  {
    name: "Ban Thuyết Trình",
    members: [
      { id: 1, name: "Hồ Nhật Thành", mssv: "23521439", avatar: anh10 },
      { id: 2, name: "Nguyễn Lâm Bảo Phúc", mssv: "23521208", avatar: anh7 },
      { id: 3, name: "Nguyễn Đức Duy", mssv: "24520386", avatar: anh3 },
    ],
  },
];

export default function AboutPage() {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handlePrevTeam = () => {
    setDirection(-1);
    setCurrentTeamIndex((prev) => (prev === 0 ? teams.length - 1 : prev - 1));
  };

  const handleNextTeam = () => {
    setDirection(1);
    setCurrentTeamIndex((prev) => (prev === teams.length - 1 ? 0 : prev + 1));
  };

  const currentTeam = teams[currentTeamIndex];

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-dvh bg-[#0b0f16] text-white">
      {/* Background gradients */}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1218]/90 backdrop-blur shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
          >
            {/* Gradient background bên trong card */}
            <div className="relative p-4 sm:p-10 bg-[radial-gradient(80%_70%_at_0%_0%,rgba(236,72,153,0.6)_0%,rgba(236,72,153,0.15)_35%,transparent_50%)]">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center mb-12"
              >
                <h1 className="text-5xl md:text-6xl mb-2 text-pink-400 font-semibold">
                  Chè đậu đỏ
                </h1>
                <p className="text-2xl font-semibold text-white">
                  - Nhóm 5 -
                </p>
              </motion.div>

              {/* Tên ban */}
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentTeamIndex}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl md:text-4xl font-semibold text-center text-pink-400 mb-8"
                >
                  {currentTeam.name}
                </motion.h2>
              </AnimatePresence>

              {/* Container cho team với fixed height để tránh di chuyển */}
              <div className="relative min-h-[340px] flex items-start justify-center pt-8">
                {/* Grid thành viên*/}
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentTeamIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                    className="w-full px-4 sm:px-8 mt-8"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 place-items-center">
                      {currentTeam.members.map((member, index) => (
                        <motion.button
                          key={member.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: index * 0.1,
                            duration: 0.3,
                            type: "spring",
                            stiffness: 200
                          }}
                          className="flex flex-col items-center group cursor-pointer"
                          onClick={() => console.log(`Clicked: ${member.name}`)}
                        >
                          {/* Avatar */}
                          <div className="relative mb-4">
                            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-pink-400 transition-all duration-300 shadow-lg group-hover:shadow-pink-500/50">
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            {/* Overlay effect on hover */}
                            <div className="absolute inset-0 rounded-full bg-pink-500/0 group-hover:bg-pink-500/20 transition-all duration-300" />
                          </div>

                          {/* Tên */}
                          <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-pink-400 transition-colors text-center">
                            {member.name}
                          </h3>

                          {/* MSSV */}
                          <p className="text-base font-semibold text-pink-400">
                            {member.mssv}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation buttons */}
                <button
                  onClick={handlePrevTeam}
                  className="absolute left-0 top-1/2 -translate-y-16 sm:-translate-x-2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Ban trước"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={handleNextTeam}
                  className="absolute right-0 top-1/2 -translate-y-16 sm:translate-x-2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Ban tiếp theo"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-8">
                {teams.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentTeamIndex ? 1 : -1);
                      setCurrentTeamIndex(index);
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentTeamIndex
                        ? "bg-pink-400 w-8"
                        : "bg-white/30 hover:bg-white/50 w-2"
                    }`}
                    aria-label={`Chuyển đến ${teams[index].name}`}
                  />
                ))}
              </div>
            </div>

            {/* Tạo bóng mờ dưới card */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 -bottom-6 h-10 rounded-full bg-black/40 blur-2xl"
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}