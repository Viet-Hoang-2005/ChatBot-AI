from unittest import result
from flask import Flask, json, request, jsonify
from flask_cors import CORS
from myChat import handle_query, is_tool_query, general_chat, reset_consultation
from db_storage import add_to_cache, search_similar, clear_cache, get_cache_stats
import re
import os

app = Flask(__name__)
CORS(app)  # cho phép React call API

# Cấu hình threshold
CACHE_THRESHOLD = float(os.getenv("CACHE_THRESHOLD", "0.92"))

# Endpoint chính để xử lý câu hỏi từ FE
@app.route("/query", methods=["GET"])
def query():
    user_query = request.args.get("q")

    if not user_query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    try:
        # CASE 1: Câu hỏi liên quan đến việc TÌM CÔNG CỤ
        if is_tool_query(user_query):
            # Tìm kiếm trong cache trước với threshold có thể cấu hình
            cached_query, cached_response, score = search_similar(
                user_query,
                threshold=CACHE_THRESHOLD
            )
            
            if cached_response:
                print(f"[TOOLS] Returning from cache (score: {score:.4f})")
                    # Đảm bảo có mode để FE nhận diện
                if "mode" not in cached_response:
                    cached_response["mode"] = "tools"
                return jsonify(cached_response)
            
            # Nếu không tìm thấy trong cache, gọi Gemini structured (myChat.handle_query)
            print("[TOOLS] Calling Gemini API for new query")
            response = handle_query(user_query)
            
            # Thêm mode cho FE nhận diện
            if isinstance(response, dict):
                response.setdefault("mode", "tools")

            # Lưu vào cache
            add_to_cache(user_query, response)
            print(f"Saved to cache: '{user_query[:50]}...'")
            
            # Trả về response json cho FE
            return jsonify(response)
        
        # CASE 2: Câu hỏi bình thường
        print(f"[CHAT] General chat for query: '{user_query[:50]}...'")
        reply_text = general_chat(user_query)

        # Không lưu cache
        return jsonify({
            "mode": "chat",
            "reply": reply_text
        })

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Endpoint để xem thống kê cache
@app.route("/cache/stats", methods=["GET"])
def cache_stats():
    """Endpoint để xem thống kê cache"""
    try:
        stats = get_cache_stats()
        return jsonify({
            "success": True,
            "current_threshold": CACHE_THRESHOLD,
            **stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint để xóa toàn bộ cache
@app.route("/cache/clear", methods=["POST"])
def cache_clear():
    """Endpoint để xóa toàn bộ cache"""
    try:
        clear_cache()
        return jsonify({
            "success": True,
            "message": "Cache đã được xóa hoàn toàn"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint để reset cuộc hội thoại
@app.route("/conversation/reset", methods=["POST"])
def conversation_reset():
    """
    Reset cuộc hội thoại hiện tại trên BE:
    - Xóa lịch sử trong TechConsultant
    - Khởi tạo lại messages ban đầu
    """
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
