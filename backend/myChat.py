import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
# API key Gemini
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# JSON Schema cho structured output
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

class TechConsultant:
    def __init__(self, model="gemini-2.5-flash", temperature=0):
        # Sử dụng json_schema với structured output
        self.model = ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            max_output_tokens=None,
            timeout=None,
            max_retries=3,
        ).with_structured_output(json_schema, method="json_mode")
        
        # System message chi tiết
        system_message = SystemMessage(content="""
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
Nếu không chắc giá trị, hãy trả về chuỗi `"Unknown"` hoặc mảng rỗng `[]`, KHÔNG được bỏ qua field.

Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
""")        
        self.messages = [
            system_message,
            HumanMessage(content="Chào anh/chị! Em cần tư vấn công cụ công nghệ phù hợp."),
            AIMessage(content="Xin chào! Tôi rất vui được hỗ trợ bạn tìm kiếm công cụ công nghệ phù hợp. Hãy chia sẻ với tôi về dự án, mục tiêu và yêu cầu cụ thể nhé!")
        ]

    def ask(self, question):
        """Đặt câu hỏi tư vấn công cụ công nghệ"""
        # Làm giàu câu hỏi với context
        enhanced_question = f"""
Câu hỏi: {question}

"""
        self.messages.append(HumanMessage(content=enhanced_question))
        
        try:
            # Gọi AI với structured output
            response = self.model.invoke(self.messages)
            print("[TOOLS] 💡 Raw response:", response)
            # Validate và clean response
            validated_response = self._validate_response(response)
            print("[TOOLS] ✅ Validated response:", type(validated_response))
            # Lưu conversation history
            summary = f"Đã tư vấn {len(validated_response['recommended_tools'])} công cụ cho: {question[:50]}..."
            self.messages.append(AIMessage(content=summary))
            
            return validated_response
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            
            # Fallback response
            fallback_response = {
                            "intro": "Hiện tại hệ thống đang gặp lỗi!",
                            "recommended_tools": [{
                                "name": "Lỗi hệ thống",
                                "category": "Error",
                                "description": f"Đã xảy ra lỗi: {str(e)[:100]}...",
                                "url": "",
                                "quick_guide": [],
                                "setup_time": "Unknown",
                                "difficulty_level": "Unknown",
                                "advantages": [],
                                "disadvantages": [],
                                "pricing": "Unknown",
                                "best_for": "Unknown"
                            }],
                            "comparison": [],
                            "final_recommendation": ["Vui lòng thử lại hoặc đặt câu hỏi khác."],
                            "next_steps": ["Kiểm tra kết nối mạng", "Thử lại sau 5 phút", "Liên hệ hỗ trợ nếu lỗi tiếp tục"]
                        }
            
            self.messages.append(AIMessage(content=f"Đã xảy ra lỗi: {str(e)[:50]}..."))
            return fallback_response

    def _validate_response(self, response):
        """Validate và làm sạch response từ AI"""
        try:
            # Nếu response là dict (chuẩn structured output)
            if isinstance(response, dict):
                return response
            else:
                return response.dict()  # Chuyển sang dict nếu là pydantic model
        except Exception as e:
            print(f"🟡 Validation error: {e}")
            return {
                "intro": "Đã xảy ra lỗi khi xử lý phản hồi!",
                "recommended_tools": [{
                    "name": "Lỗi validation",
                    "category": "Error",
                    "description": str(e)[:100],
                    "url": "",
                    "quick_guide": [],
                    "setup_time": "Unknown",
                    "difficulty_level": "Unknown",
                    "advantages": [],
                    "disadvantages": [],
                    "pricing": "Unknown",
                    "best_for": "Unknown"
                }],
                "comparison": [],
                "final_recommendation": "Vui lòng thử lại với câu hỏi khác",
                "next_steps": ["Kiểm tra input", "Thử lại", "Liên hệ hỗ trợ"]
            }

    def reset_conversation(self):
        """Reset cuộc trò chuyện"""
        system_msg = self.messages[0]
        self.messages = [
            system_msg,
            HumanMessage(content="Chào anh/chị! Em cần tư vấn công cụ công nghệ phù hợp."),
            AIMessage(content="Xin chào! Tôi rất vui được hỗ trợ bạn tìm kiếm công cụ công nghệ phù hợp. Hãy chia sẻ với tôi về dự án, mục tiêu và yêu cầu cụ thể nhé!")
        ]

    def get_conversation_summary(self):
        """Lấy tóm tắt cuộc trò chuyện"""
        human_msgs = [msg for msg in self.messages if isinstance(msg, HumanMessage)]
        return f"Đã có {len(human_msgs)} câu hỏi trong cuộc trò chuyện này"
    
    def general_chat_with_memory(self, question: str) -> str:
        """
        Trả lời các câu hỏi chat bình thường (small talk, hỏi thông tin, v.v.)
        nhưng CÓ sử dụng lại lịch sử self.messages làm context chung.
        """
        # System riêng cho chế độ chat thường (không JSON)
        chat_system = SystemMessage(content="""
Bạn là một trợ lý AI thân thiện hỗ trợ người dùng bằng tiếng Việt.

BỐI CẢNH:
- Bạn đang trò chuyện liên tục với người dùng trong CÙNG MỘT PHIÊN.
- Bạn có thể tham chiếu lại những gì người dùng đã hỏi / bạn đã trả lời trước đó
  trong phiên hiện tại nếu điều đó giúp câu trả lời tự nhiên hơn.

YÊU CẦU:
- Trả lời ngắn gọn, rõ ràng, bám sát câu hỏi hiện tại.
- Không trả về JSON, chỉ là văn bản thuần.
- Không cần nhắc lại toàn bộ lịch sử, chỉ liên hệ khi thực sự cần thiết.
""")

        # Lấy lịch sử hiện tại nhưng bỏ system message gốc (dành cho tư vấn công cụ)
        history_without_system = [
            msg for msg in self.messages
            if not isinstance(msg, SystemMessage)
        ]

        # Xây dựng list messages gửi lên model chat thường
        messages = [
            chat_system,
            *history_without_system,
            HumanMessage(content=question)
        ]

        # Gọi model chat thường với full context
        resp = _general_chat_model.invoke(messages)

        try:
            reply_text = resp.content
        except AttributeError:
            reply_text = str(resp)

        # 
        print("[CHAT] 💡 Response:", reply_text)

        # Lưu tiếp đoạn hội thoại này vào self.messages để lần sau còn nhớ
        self.messages.append(HumanMessage(content=question))
        self.messages.append(AIMessage(content=reply_text))

        return reply_text


# Global instance để duy trì conversation
_tech_consultant = None

# Lấy hoặc tạo consultant instance
def get_consultant():
    global _tech_consultant
    if _tech_consultant is None:
        _tech_consultant = TechConsultant()
    return _tech_consultant

# Interface đơn giản để hỏi về công cụ công nghệ
def ask_for_tools(question):
    consultant = get_consultant()
    return consultant.ask(question)

# Reset cuộc tư vấn
def reset_consultation():
    global _tech_consultant
    if _tech_consultant:
        _tech_consultant.reset_conversation()
        return "✅ Đã reset cuộc tư vấn!"
    return "⚠️ Chưa có cuộc tư vấn nào để reset"

# Lấy tóm tắt cuộc tư vấn
def get_consultation_summary():
    consultant = get_consultant()
    return consultant.get_conversation_summary()

# Ghi lại câu hỏi TOOLS vào file testcases.txt
def log_tool_query(query, path="testcases.txt"):
    try:
        with open(path, "a", encoding="utf-8") as f:
            f.write(query.strip() + "\n")
    except Exception as e:
        print(f"[LOG] Failed to write test case: {e}")

# Xử lý query từ người dùng
def handle_query(query):
    try:
        try:
            if is_tool_query(query):
                log_tool_query(query)
        except Exception as e:
            print(f"[LOG] Error during is_tool_query check: {e}")

        result = ask_for_tools(query)
        return result
    except Exception as e:
        return {"error": str(e)}
    
'''    # Nếu response là string JSON
            if isinstance(response, str):
                return json.loads(response)

            # Nếu không hợp lệ
            return {
                "recommended_tools": [],
                "comparison": [],
                "final_recommendation": "Phản hồi không hợp lệ",
                "next_steps": ["Thử lại câu hỏi"]
            }
            '''

# Model chuyên dùng để PHÂN LOẠI query (TOOLS / CHAT)
_mode_classifier_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=None,
    timeout=None,
    max_retries=3,
)

def is_tool_query(query: str) -> bool:
    """
    Dùng Gemini để phân loại xem câu hỏi có đang cần tư vấn công cụ hay không.
    Trả về:
      - True  => query là dạng "tìm công cụ"
      - False => query là chat bình thường (chào hỏi, hỏi thông tin chung, small talk,...)
    """
    if not query:
        return False

    classification_prompt = f"""
Bạn là một mô-đun PHÂN LOẠI câu hỏi cho hệ thống tư vấn công cụ.

MỤC ĐÍCH PHÂN LOẠI

Hệ thống có 2 chế độ:
1) TOOLS: Dùng khi người dùng muốn được TÌM / CHỌN / GỢI Ý / GIỚI THIỆU / SO SÁNH / LỰA CHỌN (hoặc ngữ cảnh tương tự)
   - công cụ, phần mềm, ứng dụng, app, web, nền tảng, ngôn ngữ, dịch vụ, khoá học online,...
=> Trả lời từ khóa DUY NHẤT: TOOLS
2) CHAT: Dùng cho các câu hỏi còn lại (chào hỏi, hỏi kiến thức chung, small talk, hướng dẫn nhanh,...).
=> Trả lời từ khóa DUY NHẤT: CHAT

LƯU Ý QUAN TRỌNG:
- Chỉ trả lời đúng một trong hai từ khóa TOOLS hoặc CHAT, KHÔNG được thêm gì khác.

Bây giờ hãy phân loại câu sau:

User: "{query}"
Assistant:
"""
    resp = _mode_classifier_model.invoke(classification_prompt)

    try:
        text = resp.content.strip().upper()
    except AttributeError:
        text = str(resp).strip().upper()

    # Debug cho dễ theo dõi server log
    print(f"❔ Request: {query!r} -> Type: {text!r}")

    # Nếu model trả đúng TOOLS thì coi là tìm công cụ
    if "TOOLS" in text:
        return True

    # Mặc định là CHAT
    return False

# Model cho chat bình thường (không structured_output)
_general_chat_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=None,
    timeout=None,
    max_retries=3,
)

def general_chat(query: str) -> str:
    """
    Trả lời các câu hỏi bình thường (chào hỏi, giới thiệu, small talk,...)
    nhưng dùng CHUNG lịch sử hội thoại của TechConsultant.
    """
    consultant = get_consultant()
    return consultant.general_chat_with_memory(query)

# Sample questions for testing
SAMPLE_QUESTIONS = {
    "web_dev": "Tôi muốn tạo website bán hàng online, budget 2-3 triệu",
    "mobile_app": "Cần phát triển app mobile cho startup, có kinh nghiệm React",
    "design": "Tôi là học sinh cần công cụ thiết kế poster và logo miễn phí",
    "project_mgmt": "Team 5 người cần quản lý dự án phần mềm hiệu quả",
    "data_analysis": "Phân tích dữ liệu bán hàng cho shop online nhỏ"
}