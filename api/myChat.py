import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv

# API key Gemini
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# 1. CẤU HÌNH HẰNG SỐ
# Chỉ nhớ 20 tin nhắn gần nhất để tiết kiệm token
HISTORY_WINDOW_SIZE = 20

# JSON Schema cho phản hồi tư vấn công cụ
JSON_SCHEMA = {
  "title": "ToolInfoSchema",
  "type": "object",
  "properties": {
    "intro": {
      "type": "string",
      "description": "Phản hồi người dùng"
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

BASE_TOOL_PROMPT = """ Bạn là một trợ lý AI chuyên tư vấn công cụ công nghệ trên Internet.

NHIỆM VỤ:
- Phân tích nhu cầu của người dùng
- Đề xuất 3 công cụ phù hợp nhất (có thể ít hơn nếu không tìm thấy)
- So sánh chi tiết ưu/nhược điểm
- Đưa ra lời khuyên cụ thể 
- Các bước tiếp theo chỉ cần liệt kê (không cần tiêu đề)
- Ở comparison mỗi công cụ phải là một mục riêng biệt không được gộp lại so sánh chung
- Trả về JSON hợp lệ, không sử dụng Markdown
- Ngôn ngữ trả lời mặc định là tiếng Việt

NGUYÊN TẮC TƯ VẤN:
1. Ưu tiên công cụ phù hợp với trình độ người dùng
2. Có cộng đồng hỗ trợ tốt
3. Dễ học và triển khai nhanh
4. Phổ biến rộng rãi trên thị trường

BẮT BUỘC: Luôn trả về JSON hợp lệ theo schema sau, không thiếu bất kỳ field nào.
Nếu không chắc giá trị, hãy trả về chuỗi "Unknown" hoặc mảng rỗng [], KHÔNG được bỏ qua field.
"""

BASE_CHAT_PROMPT = """ Bạn là một trợ lý AI chuyên tư vấn công cụ công nghệ trên Internet.

BỐI CẢNH:
- Bạn đang trò chuyện liên tục với người dùng trong cùng một phiên.
- Bạn có thể tham chiếu lại những gì người dùng đã hỏi / bạn đã trả lời trước đó
  trong phiên hiện tại nếu điều đó giúp câu trả lời tự nhiên hơn.

YÊU CẦU:
- Ngôn ngữ trả lời mặc định là tiếng Việt, trả lời bám sát câu hỏi hiện tại.
- Không cần nhắc lại toàn bộ lịch sử, chỉ liên hệ khi thực sự cần thiết.
"""

# 2. CẤU HÌNH MODEL GEMINI
_mode_classifier_model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0, max_retries=3)
_general_chat_model = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5, max_retries=3)

# 3. CLASS TECH CONSULTANT
class TechConsultant:
    # Khởi tạo bot tư vấn công cụ
    def __init__(self, model="gemini-2.5-flash", temperature=0):
        # Thiết lập model với JSON Schema
        self.model = ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_retries=3,
        ).with_structured_output(JSON_SCHEMA, method="json_mode")
        
        # Thiết lập profile và chat history ban đầu
        self.current_profile = None
        self.chat_history = []
     
    # Tạo chuỗi context từ profile hiện tại
    def _get_profile_context(self):
        if not self.current_profile:
            return ""
            
        p = self.current_profile
        return f"""
THÔNG TIN NGƯỜI DÙNG:
- Họ tên: {p.get('fullName', 'Bạn')}
- Độ tuổi: {p.get('ageGroup', '')}
- Nghề nghiệp: {p.get('profession', 'Người dùng')}
- Quốc gia: {p.get('country', '')}
- Mô tả thêm: {p.get('description', '')}

YÊU CẦU CÁ NHÂN HÓA:
- Hãy gọi người dùng bằng tên "{p.get('fullName', 'Bạn')}" nếu có thể.
- Vì người dùng là "{p.get('profession', 'Người dùng')}" ({p.get('ageGroup', '')}), hãy điều chỉnh từ ngữ cho phù hợp.
  + Nếu là người mới/học sinh: Giải thích đơn giản, dễ hiểu, tránh thuật ngữ sâu.
  + Nếu là chuyên gia/IT: Dùng thuật ngữ chuyên ngành, đi thẳng vào vấn đề.
- Cân nhắc các công cụ phổ biến tại {p.get('country', '')}.
"""

    # Xây dựng danh sách messages hoàn chỉnh với lịch sử và profile
    def _build_messages(self, system_prompt_content, question):
        # Tạo System Message động (kết hợp prompt gốc + profile)
        full_system_prompt = system_prompt_content + "\n" + self._get_profile_context()
        
        # Lấy lịch sử gần nhất (Sliding Window)
        recent_history = self.chat_history[-HISTORY_WINDOW_SIZE:] if self.chat_history else []
        
        # Trả về danh sách messages hoàn chỉnh để gửi cho Gemini
        return [SystemMessage(content=full_system_prompt)] + recent_history + [HumanMessage(content=question)]

    # Hàm cập nhật System Prompt dựa trên Profile mới nhất
    def update_system_prompt(self, profile):        
        self.current_profile = profile
    
    # Hàm đặt lại hội thoại
    def reset_conversation(self):
        self.chat_history = []

    # Hàm xử lý tư vấn công cụ (JSON)
    def ask(self, question):
        try:
            # Tạo messages chuyên cho Tools
            messages = self._build_messages(
                system_prompt_content=BASE_TOOL_PROMPT,
                question=f"Câu hỏi: {question}"
            )

            # Gọi model để lấy phản hồi cho câu hỏi của người dùng
            response = self.model.invoke(messages)
            
            print(f"💡 [TOOLS] Response generated: {response}...")
            
            # Xác thực phản hồi dạng dict
            validated_response = response if isinstance(response, dict) else response.dict()
            print("✅ [TOOLS] Validated response:", type(validated_response))

            # Trích xuất thông tin chính để lưu vào lịch sử
            intro_text = validated_response.get('intro', '')
            tools = validated_response.get('recommended_tools', [])
            tool_names = ", ".join([t.get('name', 'Công cụ') for t in tools])
            
            # Lưu User Message
            self.chat_history.append(HumanMessage(content=question))

            # Lưu AI Message (Intro + Danh sách tên)
            summary_for_history = f"{intro_text}\n(Đã đề xuất các công cụ: {tool_names})"
            self.chat_history.append(AIMessage(content=summary_for_history))
            
            # Trả về phản hồi đã xác thực
            return validated_response
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            
            # Lưu lỗi vào lịch sử hội thoại
            self.chat_history.append(AIMessage(content=f"Lỗi hệ thống: {str(e)[:50]}"))

            # Trả về phản hồi mặc định khi lỗi
            return self._get_fallback_response(str(e))
        
    # Hàm xử lý chat thường
    def general_chat_with_memory(self, question: str) -> str:
        try:
            # Tạo messages chuyên cho Chat
            messages = self._build_messages(
                system_prompt_content=BASE_CHAT_PROMPT,
                question=question
            )

            # Gọi model chat thường
            resp = _general_chat_model.invoke(messages)
            reply_text = resp.content if hasattr(resp, 'content') else str(resp)
        
            print(f"💡 [CHAT] Response generated: {reply_text[:50]}...")
        
            # Lưu lịch sử
            self.chat_history.append(HumanMessage(content=question))
            self.chat_history.append(AIMessage(content=reply_text))
            
            return reply_text
        except Exception as e:
            return "Xin lỗi, hiện tại tôi không thể phản hồi. Vui lòng thử lại sau."

    # Phản hồi mặc định khi lỗi xảy ra
    def _get_fallback_response(self, error_msg):
        return {
            "intro": "Hệ thống đang gặp lỗi!",
            "recommended_tools": [],
            "comparison": [],
            "final_recommendation": [],
            "next_steps": []
        }

# 4. QUẢN LÝ SESSIONS TƯ VẤN
# Kho chứa các phiên làm việc riêng biệt
_active_sessions = {}

# Lấy bot riêng của session đó, nếu chưa có thì tạo mới
def get_consultant(session_id, user_profile=None):
    # Sử dụng biến toàn cục để lưu trữ sessions
    global _active_sessions
    
    # Nếu session chưa tồn tại, tạo bot mới
    if session_id not in _active_sessions:
        print(f"🆕 New session: {session_id}")
        _active_sessions[session_id] = TechConsultant() # Bot mới sẽ dùng prompt gốc ở trên
    
    # Lấy bot của session đó
    consultant = _active_sessions[session_id]
    
    # Cập nhật profile nếu có thay đổi
    if user_profile:
        consultant.update_system_prompt(user_profile)
    
    return consultant

# 5. CÁC HÀM XỬ LÝ CHÍNH
# Hàm phân loại câu hỏi là Tools hay Chat
def is_tool_query(query: str) -> bool:
    # Nếu câu hỏi trống, trả về False
    if not query: return False
    
    # Prompt phân loại
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
        # Gọi model phân loại
        resp = _mode_classifier_model.invoke(prompt)
        
        # Lấy kết quả và chuẩn hoá
        text = (resp.content or "").strip().upper()
        print(f"❔ Request: '{query[:50]}...' -> Type: {text}")
        
        # Trả về True nếu là Tools, False nếu là Chat
        return "TOOLS" in text
    except:
        return False

# Hàm xử lý tìm tool
def handle_query(query, session_id, user_profile=None):
    consultant = get_consultant(session_id, user_profile)
    return consultant.ask(query)

# Hàm xử lý chat thường
def general_chat(query, session_id, user_profile=None):
    consultant = get_consultant(session_id, user_profile)
    return consultant.general_chat_with_memory(query)

# Hàm reset bộ nhớ hội thoại của session
def reset_consultation(session_id):
    global _active_sessions
    if session_id in _active_sessions:
        _active_sessions[session_id].reset_conversation()
        return f"✅ Đã reset bộ nhớ cho session {session_id}!"
    return "⚠️ Session mới tinh."