import os
import requests
import json
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

SIMPLETEX_UAT = "4ZJ9p2TaTjO1argdM5RaJvRTpmzQigJuBepYKShEVO7XPieL6tiGadDuiTdmJfeQ"
api_url = "https://server.simpletex.cn/api/latex_ocr_turbo"  # API接口地址
header = {"token": SIMPLETEX_UAT}  # 鉴权信息

@app.route('/')
def index():
    return render_template('index.html')  # 确保从 templates 文件夹中加载 index.html

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # 将文件发送到API
    files = {"file": (file.filename, file.stream)}
    try:
        res = requests.post(api_url, files=files, headers=header)
        if res.status_code == 200:
            return jsonify(json.loads(res.text))
        else:
            return jsonify({"error": f"API request failed with status code {res.status_code}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
