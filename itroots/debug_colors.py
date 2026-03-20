from PIL import Image
import os

images_dir = r"e:\IT 4.5\IT 4.5\itroots\public\images\projects\data-analytics-python"
images = ["Expense & Revenue Dashboard.png", "Public Transport Performance.png"]

for img_name in images:
    path = os.path.join(images_dir, img_name)
    try:
        img = Image.open(path).convert("RGB")
        width, height = img.size
        pixels = img.load()
        mid_y = height // 2
        
        print(f"--- {img_name} ---")
        print(f"Size: {width}x{height}")
        # Sample left edge pixels
        print("Left edge (0, mid_y):", pixels[0, mid_y])
        print("Right edge (width-1, mid_y):", pixels[width-1, mid_y])
        
        # Sample slightly inward
        print("Left+10 (10, mid_y):", pixels[10, mid_y])
        print("Right-10 (width-11, mid_y):", pixels[width-11, mid_y])

    except Exception as e:
        print(f"Error reading {img_name}: {e}")
