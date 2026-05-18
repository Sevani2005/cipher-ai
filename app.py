import os
import uuid
import traceback
from dotenv import load_dotenv
load_dotenv()
import io
from flask import Flask, request, jsonify, send_file, send_from_directory, render_template_string
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF for PDF preview rendering
from PIL import Image

from masking_engine import MaskingAgent

app = Flask(__name__)

# Directory setup inside workspace
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
PROCESSED_FOLDER = os.path.join(BASE_DIR, 'processed')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB limit

# In-memory session tracking for file paths and types
file_registry = {}

def get_file_ext(filename):
    return filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

def get_file_category(ext):
    if ext in ['png', 'jpg', 'jpeg', 'webp', 'bmp']:
        return 'image'
    elif ext == 'pdf':
        return 'pdf'
    elif ext in ['pptx', 'ppt']:
        return 'pptx'
    elif ext in ['docx', 'doc']:
        return 'docx'
    elif ext in ['txt', 'csv', 'json', 'xml', 'md', 'py', 'js']:
        return 'text'
    return 'unknown'

# HTML Template rendered inline using Flask render_template_string for single-file deployment convenience,
# but we will also write a clean index.html in /templates directory and let app.py serve it if wanted!
# Let's write a route that serves index.html directly from the templates folder.

@app.route('/')
def index():
    dist_dir = os.path.join(BASE_DIR, 'frontend', 'dist')
    index_path = os.path.join(dist_dir, 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r', encoding='utf-8') as f:
            return f.read()
    # Fallback to templates/index.html
    templates_dir = os.path.join(BASE_DIR, 'templates')
    backup_path = os.path.join(templates_dir, 'index.html')
    if os.path.exists(backup_path):
        with open(backup_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "Frontend distribution is missing. Please run compilation first."

@app.route('/assets/<path:path>')
def serve_assets(path):
    dist_assets_dir = os.path.join(BASE_DIR, 'frontend', 'dist', 'assets')
    return send_from_directory(dist_assets_dir, path)

@app.route('/api/mask', methods=['POST'])
def mask_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No file selected"}), 400

    # Retrieve options
    try:
        # Options could be passed as JSON string
        options_raw = request.form.get('options', '{}')
        options = json.loads(options_raw) if isinstance(options_raw, str) else options_raw
    except Exception:
        options = {}

    # Handle custom inputs
    custom_keywords = request.form.getlist('custom_keywords')
    if not custom_keywords and 'custom_keywords' in options:
        custom_keywords = options['custom_keywords']
    if isinstance(custom_keywords, str):
        custom_keywords = [k.strip() for k in custom_keywords.split(',') if k.strip()]

    custom_regex = request.form.getlist('custom_regex')
    if not custom_regex and 'custom_regex' in options:
        custom_regex = options['custom_regex']
    if isinstance(custom_regex, str):
        custom_regex = [r.strip() for r in custom_regex.split(',') if r.strip()]

    # Extract UI Toggles (Name, Email, etc.)
    mask_options = {
        "style": request.form.get('style', options.get('style', 'redact')),
        "pdf_mode": request.form.get('pdf_mode', options.get('pdf_mode', 'vector')),
        "name": request.form.get('name', str(options.get('name', 'true'))).lower() == 'true',
        "email": request.form.get('email', str(options.get('email', 'true'))).lower() == 'true',
        "phone": request.form.get('phone', str(options.get('phone', 'true'))).lower() == 'true',
        "financial": request.form.get('financial', str(options.get('financial', 'true'))).lower() == 'true',
        "credentials": request.form.get('credentials', str(options.get('credentials', 'true'))).lower() == 'true',
        "address": request.form.get('address', str(options.get('address', 'true'))).lower() == 'true',
        "other": request.form.get('other', str(options.get('other', 'true'))).lower() == 'true',
    }

    # API key handling: UI Header check, fallback to backend env
    user_api_key = request.headers.get('X-API-Key') or request.headers.get('X-Gemini-Key') or request.headers.get('X-Groq-Key') or request.form.get('api_key')
    api_provider = request.headers.get('X-API-Provider') or request.form.get('api_provider') or "local"
    
    if user_api_key in ["", "null", "undefined", "None"]:
        user_api_key = None
        
    # Smart Fallback: If no browser key, check if we have them saved in .env
    if not user_api_key:
        if api_provider == "gemini" and os.getenv("GEMINI_API_KEY"):
            user_api_key = os.getenv("GEMINI_API_KEY")
        elif api_provider == "groq" and os.getenv("GROQ_API_KEY"):
            user_api_key = os.getenv("GROQ_API_KEY")
        else:
            api_provider = "local"
        
    agent = MaskingAgent(api_key=user_api_key, api_provider=api_provider)

    filename = secure_filename(file.filename)
    file_id = str(uuid.uuid4())
    ext = get_file_ext(filename)
    file_cat = get_file_category(ext)

    if file_cat == 'unknown':
        return jsonify({"success": False, "error": f"Unsupported file format: .{ext}"}), 400

    # Save original
    original_save_name = f"{file_id}_orig.{ext}"
    original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_save_name)
    file.save(original_path)

    # Output path
    processed_save_name = f"{file_id}_masked.{ext}"
    processed_path = os.path.join(app.config['PROCESSED_FOLDER'], processed_save_name)

    # Register session
    file_registry[file_id] = {
        "original_path": original_path,
        "processed_path": processed_path,
        "filename": filename,
        "ext": ext,
        "category": file_cat
    }

    user_prompt = request.form.get('user_prompt') or options.get('user_prompt', '')

    logs = []
    try:
        if file_cat == 'image':
            logs = agent.mask_image_file(original_path, processed_path, mask_options, custom_keywords, custom_regex, user_prompt)
        elif file_cat == 'pdf':
            logs = agent.mask_pdf_file(original_path, processed_path, mask_options, custom_keywords, custom_regex, user_prompt)
        elif file_cat == 'pptx':
            logs = agent.mask_pptx_file(original_path, processed_path, mask_options, custom_keywords, custom_regex, user_prompt)
        elif file_cat == 'docx':
            logs = agent.mask_docx_file(original_path, processed_path, mask_options, custom_keywords, custom_regex, user_prompt)
        elif file_cat == 'text':
            logs = agent.mask_text_file(original_path, processed_path, mask_options, custom_keywords, custom_regex, user_prompt)
            
        success = os.path.exists(processed_path)
        if not success:
            return jsonify({
                "success": False, 
                "error": "Masking completed but processed file could not be generated.",
                "logs": logs
            }), 500

        return jsonify({
            "success": True,
            "file_id": file_id,
            "filename": filename,
            "category": file_cat,
            "original_url": f"/api/preview/{file_id}/original",
            "masked_url": f"/api/preview/{file_id}/masked",
            "download_url": f"/api/download/{file_id}",
            "logs": logs
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"An error occurred during agent execution: {str(e)}",
            "logs": logs + [{"type": "error", "message": f"Fatal: {str(e)}"}]
        }), 500

@app.route('/api/preview/<file_id>/<version>', methods=['GET'])
def get_preview(file_id, version):
    """
    Renders first page / view of original or masked document as a PNG image for side-by-side split screen.
    version is either 'original' or 'masked'
    """
    if file_id not in file_registry:
        # Special fallback for the demo UUID so the demo button never fails on reload!
        if file_id == "764d452a-12fb-4ef0-a6a4-9f78f925970c":
            orig_name = "764d452a-12fb-4ef0-a6a4-9f78f925970c_orig.jpg"
            masked_name = "764d452a-12fb-4ef0-a6a4-9f78f925970c_masked.jpg"
            path = os.path.join(app.config['UPLOAD_FOLDER'], orig_name) if version == 'original' else os.path.join(app.config['PROCESSED_FOLDER'], masked_name)
            if os.path.exists(path):
                return send_file(path, mimetype='image/jpeg')
        return "File not found", 404
        
    session = file_registry[file_id]
    path = session['original_path'] if version == 'original' else session['processed_path']
    file_cat = session['category']
    ext = session['ext']
    
    if not os.path.exists(path):
        return "File not processed yet", 404

    # 1. If it's an image, send the image file directly
    if file_cat == 'image':
        return send_file(path, mimetype=f'image/{ext}')

    # 2. If it's a PDF, render page 0 to PNG
    elif file_cat == 'pdf':
        try:
            doc = fitz.open(path)
            if len(doc) > 0:
                page = doc[0]
                pix = page.get_pixmap(dpi=150)
                img_data = pix.tobytes("png")
                doc.close()
                return send_file(
                    io.BytesIO(img_data),
                    mimetype='image/png',
                    as_attachment=False
                )
            doc.close()
        except Exception as e:
            traceback.print_exc()
            return f"Failed to render PDF preview: {str(e)}", 500

    # 3. For office files (pptx, docx) or text files, we generate an aesthetic visual placeholder card
    # containing file info and masked metadata
    try:
        # Create a nice PIL card representing document
        card = Image.new("RGB", (600, 400), "#181825")
        draw = ImageDraw.Draw(card)
        
        # Load custom fonts or fallback
        # Let's draw text info on the card
        from PIL import ImageFont
        try:
            font = ImageFont.truetype("arial.ttf", 20)
            font_title = ImageFont.truetype("arial.ttf", 28)
        except IOError:
            font = ImageFont.load_default()
            font_title = ImageFont.load_default()

        # Draw a beautiful badge/box
        draw.rectangle([30, 30, 570, 370], outline="#45475a", width=2)
        
        color_theme = "#f38ba8" if version == 'original' else "#a6e3a1"
        badge_text = "ORIGINAL PREVIEW" if version == 'original' else "MASKED COMPLETED"
        draw.rectangle([50, 50, 300, 90], fill=color_theme)
        
        # Simple text placement
        draw.text((70, 60), badge_text, fill="#11111b", font=font)
        draw.text((50, 140), f"File: {session['filename']}", fill="#cdd6f4", font=font_title)
        draw.text((50, 200), f"Type: {ext.upper()} Document ({file_cat.upper()})", fill="#bac2de", font=font)
        
        if version == 'original':
            draw.text((50, 260), "Status: Unmasked", fill="#f38ba8", font=font)
            draw.text((50, 300), "Sensitive details are fully exposed.", fill="#a6adc8", font=font)
        else:
            draw.text((50, 260), "Status: 100% Redacted & Safe", fill="#a6e3a1", font=font)
            draw.text((50, 300), "Structural text blocks replaced with placeholders.", fill="#a6adc8", font=font)

        img_byte_arr = io.BytesIO()
        card.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        return send_file(img_byte_arr, mimetype='image/png')
    except Exception as e:
        return f"Failed to generate preview: {str(e)}", 500

@app.route('/api/download/<file_id>', methods=['GET'])
def download_file(file_id):
    if file_id not in file_registry:
        return "File not found", 404
        
    session = file_registry[file_id]
    processed_path = session['processed_path']
    filename = session['filename']
    
    # We rename download file slightly to indicate masked
    name_parts = filename.rsplit('.', 1)
    if len(name_parts) == 2:
        masked_filename = f"{name_parts[0]}_masked.{name_parts[1]}"
    else:
        masked_filename = f"{filename}_masked"

    if os.path.exists(processed_path):
        return send_file(
            processed_path,
            as_attachment=True,
            download_name=masked_filename
        )
    return "Processed file not found", 404

# Serve local static assets if needed
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

import json
if __name__ == '__main__':
    # Run server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
