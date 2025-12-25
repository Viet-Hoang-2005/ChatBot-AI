import React from "react";
import Header from "../components/Header.jsx";
import { motion } from "framer-motion";

// Import logo images
import facebookLogo from "../assets/Logo/Facebook.png";
import zaloLogo from "../assets/Logo/Zalo.svg";
import gmailLogo from "../assets/Logo/Gmail.png";
import phoneLogo from "../assets/Logo/Phone.png";

// Dữ liệu liên hệ
const contactMethods = [
  {
    id: 1,
    name: "Gmail",
    logo: gmailLogo,
    info: "tnvhoang2005@gmail.com",
    type: "info"
  },
  {
    id: 2,
    name: "Facebook",
    logo: facebookLogo,
    link: "https://www.facebook.com/viethoang.trannguyen.35",
    info: "facebook.com/viethoang.trannguyen.35",
    type: "link"
  },
  {
    id: 3,
    name: "Phone",
    logo: phoneLogo,
    info: "0828552878",
    type: "info"
  },
  {
    id: 4,
    name: "Zalo",
    logo: zaloLogo,
    link: "https://zalo.me/0828552878",
    info: "zalo.me/0828552878",
    type: "link"
  }
];

export default function SupportPage() {
  const handleContactClick = (contact) => {
    if (contact.type === "link" && contact.link) {
      window.open(contact.link, "_blank", "noopener,noreferrer");
    }
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

      {/* Header */}
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
          <div className="relative p-4 sm:p-10 bg-[radial-gradient(80%_70%_at_100%_0%,rgba(236,72,153,0.6)_0%,rgba(236,72,153,0.15)_35%,transparent_50%)]">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-12"
            >
              <h1 className="text-5xl md:text-6xl mb-2 text-white font-semibold">
                Thông tin liên hệ
              </h1>
              <p className="text-2xl font-semibold text-pink-400 pb-4">
                Hãy liên lạc với chúng tôi khi bạn gặp sự cố hoặc cần hỗ trợ
              </p>
          </motion.div>

              {/* Contact Methods Grid */}
              <div className="flex justify-center pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-24 max-w-6xl">
                  {contactMethods.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.3,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="flex items-center gap-6 group"
                    >
                      {/* Logo Button */}
                      <button
                        onClick={() => handleContactClick(contact)}
                        disabled={contact.type === "info"}
                        className={`flex-shrink-0 ${
                          contact.type === "link" ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <div className="w-32 h-32 md:w-36 md:h-36 flex items-center justify-center">
                          <img
                            src={contact.logo}
                            alt={contact.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </button>

                      {/* Contact Info */}
                      <div className="flex flex-col justify-center">
                        {/* Name */}
                        <h3 className="text-base md:text-2xl font-semibold text-white group-hover:text-pink-400 transition-colors">
                          {contact.name}
                        </h3>

                        {/* Info */}
                        {contact.info && (
                          <p className="text-base md:text-base text-pink-400 font-medium break-all">
                            {contact.info}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shadow effect below card */}
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