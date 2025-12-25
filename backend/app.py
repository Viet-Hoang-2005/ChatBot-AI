from flask import Flask, request, jsonify
from flask_cors import CORS
from myChat import handle_query, is_tool_query, general_chat, reset_consultation
import os

app = Flask(__name__)
CORS(app)  # Cho phép React gọi API

# Endpoint chính để xử lý câu hỏi
@app.route("/query", methods=["GET"])
def query():
    user_query = request.args.get("q")

    if not user_query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    try:
        # CASE 1: Câu hỏi tìm kiếm công cụ (TOOLS)
        if is_tool_query(user_query):
            print(f"⏳ [TOOLS] Calling Gemini API for: '{user_query[:50]}...'")
            response = handle_query(user_query)
            
            # Đảm bảo có mode để Frontend nhận diện
            if isinstance(response, dict):
                response.setdefault("mode", "tools")

            return jsonify(response)
        
        # CASE 2: Câu hỏi chat bình thường (CHAT)
        print(f"⏳ [CHAT] General chat for query: '{user_query[:50]}...'")
        reply_text = general_chat(user_query)

        return jsonify({
            "mode": "chat",
            "reply": reply_text
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Endpoint để reset cuộc hội thoại
@app.route("/conversation/reset", methods=["POST"])
def conversation_reset():
    try:
        msg = reset_consultation()
        return jsonify({
            "success": True,
            "message": msg
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)