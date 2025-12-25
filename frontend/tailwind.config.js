/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0b0f16', // màu nền chính
        panel: '#0f1218', // màu nền panel/chat bubble
        bubbleUser: '#1f2937', // màu bubble người dùng
        bubbleBot: '#0f172a' // màu bubble bot
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: []
}
