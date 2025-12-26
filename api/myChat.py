import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv

# API key Gemini
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# --- 1. CẤU HÌNH JSON SCHEMA ---
json_schema = {
  "title": "ToolInfoSchema",
  "type": "object",
  "properties": {
    "intro": {
      "type": "string",
      "description": "Phản hồi người dùng. Không chào hỏi"
    },
    "recommended_tools": {
      "type": "array",
      "description": "Danh sách công cụ đề xuất",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Tên công cụ" },
          "category": { "type": "string", "description": "Danh mục công cụ" },
          "description": { "type": "string", "description": "Mô tả ngắn gọn về công cụ" },
          "url": { "type": "string", "description": "URL chính thức của công cụ" },
          "quick_guide": {
            "type": "array",
            "description": "Hướng dẫn sử dụng nhanh",
            "items": { "type": "string" }
          },
          "setup_time": { "type": "string", "description": "Thời gian thiết lập" },
          "difficulty_level": { "type": "string", "description": "Mức độ khó" },
          "advantages": {
            "type": "array",
            "description": "Ưu điểm",
            "items": { "type": "string" }
          },
          "disadvantages": {
            "type": "array",
            "description": "Nhược điểm",
            "items": { "type": "string" }
          },
          "pricing": { "type": "string", "description": "Thông tin giá cả" },
          "best_for": { "type": "string", "description": "Phù hợp cho ai" }
        },
        "required": [
          "name", "category", "description", "url", "quick_guide",
          "setup_time", "difficulty_level", "advantages", "disadvantages",
          "pricing", "best_for"
        ]
      }
    },
    "comparison": {
      "type": "array",
      "description": "So sánh các công cụ",
      "items": { "type": "string" }
    },
    "final_recommendation": {
      "type": "array",
      "description": "Lời khuyên cuối cùng",
      "items": { "type": "string" }
    },
    "next_steps": {
      "type": "array",
      "description": "Các bước tiếp theo",
      "items": { "type": "string" }
    }
  },
  "required": ["intro", "recommended_tools", "comparison", "final_recommendation", "next_steps"]
}
# --- 2. CÁC MODEL GEMINI ---
_mode_classifier_model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, max_retries=3)
_general_chat_model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5, max_retries=3)

# --- 3. CLASS TECH CONSULTANT ---
class TechConsultant:
    def __init__(self, model="gemini-2.5-flash", temperature=0):
        self.model = ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_retries=3,
        ).with_structured_output(json_schema, method="json_mode")
        
        self.system_message = SystemMessage(content="""
Bạn là một trợ lý AI chuyên tư vấn công cụ công nghệ trên Internet.

NHIỆM VỤ:
- Phân tích nhu cầu của người dùng
- Đề xuất 3 công cụ phù hợp nhất  (có thể ít hơn nếu không tìm thấy)
- So sánh chi tiết ưu/nhược điểm
- Đưa ra lời khuyên cụ thể 
- Các bước tiếp theo chỉ cần liệt kê (không cần tiêu đề)
- Ở comparison mỗi công cụ phải là một mục riêng biệt không được gộp lại so sánh chung
- Không được thiếu các trường trong JSON trả về
- Không sử dụng Markdown
- Cung cấp hướng dẫn bước đầu

LĨNH VỰC CHUYÊN MÔN:
- Web Development (Frontend, Backend, Full-stack)
- Mobile Development (iOS, Android, Cross-platform)  
- Design & UI/UX (Figma, Adobe, Canva...)
- Project Management (Trello, Notion, Asana...)
- Marketing & Business (Analytics, Social Media...)
- Data Analysis & AI Tools
- DevOps & Cloud Services

NGUYÊN TẮC TƯ VẤN:
1. Ưu tiên công cụ miễn phí hoặc freemium
2. Phù hợp với trình độ người dùng (beginner/intermediate/advanced)
3. Có cộng đồng hỗ trợ tốt
4. Dễ học và triển khai nhanh
5. Phổ biến tại Việt Nam

BẮT BUỘC: Luôn trả về JSON hợp lệ theo schema sau, không thiếu bất kỳ field nào.
Nếu không chắc giá trị, hãy trả về chuỗi "Unknown" hoặc mảng rỗng [], KHÔNG được bỏ qua field.

Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
""")        
        self.reset_conversation()

    def reset_conversation(self):
        self.messages = [
            self.system_message,
            HumanMessage(content="Chào anh/chị! Em cần tư vấn công cụ công nghệ phù hợp."),
            AIMessage(content="Xin chào! Tôi rất vui được hỗ trợ bạn tìm kiếm công cụ công nghệ phù hợp. Hãy chia sẻ với tôi về dự án, mục tiêu và yêu cầu cụ thể nhé!")
        ]

    def ask(self, question):
        """Xử lý tư vấn công cụ (JSON)"""
        enhanced_question = f"\nCâu hỏi: {question}\n"
        self.messages.append(HumanMessage(content=enhanced_question))
        
        try:
            response = self.model.invoke(self.messages)
            print("💡 [TOOLS] Response generated: ", response)
            
            # Validate response
            validated_response = response if isinstance(response, dict) else response.dict()
            print("✅ [TOOLS] Validated response:", type(validated_response))

            # Lưu tóm tắt
            summary = f"Đã tư vấn {len(validated_response.get('recommended_tools', []))} công cụ cho: {question[:50]}..."
            self.messages.append(AIMessage(content=summary))
            return validated_response
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.messages.append(AIMessage(content=f"Đã xảy ra lỗi: {str(e)[:50]}..."))
            return self._get_fallback_response(str(e))

    def general_chat_with_memory(self, question: str) -> str:        
        chat_system = SystemMessage(content="""
Bạn là một trợ lý AI thân thiện hỗ trợ người dùng bằng tiếng Việt.

BỐI CẢNH:
- Bạn đang trò chuyện liên tục với người dùng trong CÙNG MỘT PHIÊN.
- Bạn có thể tham chiếu lại những gì người dùng đã hỏi / bạn đã trả lời trước đó
  trong phiên hiện tại nếu điều đó giúp câu trả lời tự nhiên hơn.

YÊU CẦU:
- Trả lời ngắn gọn, rõ ràng, bám sát câu hỏi hiện tại.
- Không cần nhắc lại toàn bộ lịch sử, chỉ liên hệ khi thực sự cần thiết.
""")

        # Lọc bỏ System Message của phần Tools để tránh lẫn lộn
        history_context = [msg for msg in self.messages if not isinstance(msg, SystemMessage)]
        
        # Tạo context mới cho chat thường
        messages = [chat_system] + history_context + [HumanMessage(content=question)]

        try:
            resp = _general_chat_model.invoke(messages)
            reply_text = resp.content if hasattr(resp, 'content') else str(resp)
            
            print("💡 [CHAT] Response generated: ", reply_text[:50])

            # Lưu vào lịch sử chung để duy trì ngữ cảnh cho cả 2 chế độ
            self.messages.append(HumanMessage(content=question))
            self.messages.append(AIMessage(content=reply_text))
            return reply_text
        except Exception as e:
            return "Xin lỗi, hiện tại tôi không thể phản hồi. Vui lòng thử lại sau."

    def _get_fallback_response(self, error_msg):
        return {
            "intro": "Hệ thống đang gặp lỗi!",
            "recommended_tools": [],
            "comparison": [],
            "final_recommendation": ["Vui lòng thử lại hoặc đặt câu hỏi khác."],
            "next_steps": ["Thử lại sau 5 phút"]
        }

# --- 4. QUẢN LÝ SESSION (LOGIC MỚI ĐỂ FIX LỖI NHỚ NHẦM) ---

# Kho chứa các phiên làm việc riêng biệt
_active_sessions = {}

def get_consultant(session_id):
    """Lấy bot riêng của session đó, nếu chưa có thì tạo mới"""
    global _active_sessions
    if session_id not in _active_sessions:
        print(f"🆕 Creating new memory for session: {session_id}")
        _active_sessions[session_id] = TechConsultant() # Bot mới sẽ dùng prompt gốc ở trên
    return _active_sessions[session_id]

# --- 5. CÁC HÀM XỬ LÝ CHÍNH (Được Index.py gọi) ---

def is_tool_query(query: str) -> bool:
    if not query: return False
    
    # Prompt phân loại (Giữ nguyên logic của bạn)
    prompt = f"""
Bạn là một mô-đun PHÂN LOẠI câu hỏi cho hệ thống tư vấn công cụ.

Hệ thống có 2 chế độ:
1) TOOLS: Dùng khi người dùng muốn được TÌM / CHỌN / GỢI Ý / GIỚI THIỆU / SO SÁNH / LỰA CHỌN (hoặc ngữ cảnh tương tự)
    cho công cụ, phần mềm, ứng dụng, app, web, nền tảng, ngôn ngữ, dịch vụ, khoá học online,...
=> Trả lời từ khóa DUY NHẤT: TOOLS
2) CHAT: Dùng cho các câu hỏi còn lại (chào hỏi, hỏi kiến thức chung, small talk, hướng dẫn nhanh,...)
=> Trả lời từ khóa DUY NHẤT: CHAT

Bây giờ hãy phân loại câu sau:

User: "{query}"
Assistant:
"""
    try:
        resp = _mode_classifier_model.invoke(prompt)
        text = (resp.content or "").strip().upper()
        print(f"❔ Request: '{query[:50]}...' -> Type: {text}")
        return "TOOLS" in text
    except:
        return False

def handle_query(query, session_id):
    """Xử lý tìm tool (Có session_id)"""
    consultant = get_consultant(session_id)
    return consultant.ask(query)

def general_chat(query, session_id):
    """Xử lý chat thường (Có session_id)"""
    consultant = get_consultant(session_id)
    return consultant.general_chat_with_memory(query)

def reset_consultation(session_id):
    """Reset phiên chat cụ thể"""
    global _active_sessions
    if session_id in _active_sessions:
        _active_sessions[session_id].reset_conversation()
        return f"✅ Đã reset bộ nhớ cho session {session_id}!"
    return "⚠️ Session mới tinh."