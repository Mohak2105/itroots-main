
import sys
import os

try:
    import pypdf
except ImportError:
    try:
        import PyPDF2 as pypdf
    except ImportError:
        print("MISSING_LIBS")
        sys.exit(0)

pdf_path = os.path.join("data", "ITROOTS Data Science & AI Brochure .pdf")
if not os.path.exists(pdf_path):
    print(f"FILE_NOT_FOUND: {pdf_path}")
    sys.exit(0)

try:
    reader = pypdf.PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)
except Exception as e:
    print(f"ERROR: {e}")
