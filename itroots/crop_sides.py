from PIL import Image
import os
import shutil

def crop_sides(image_path, percentage=0.15):
    try:
        if not os.path.exists(image_path):
            print(f"File not found: {image_path}")
            return

        # Backup
        backup_path = image_path + ".bak"
        if not os.path.exists(backup_path):
            shutil.copy2(image_path, backup_path)
            print(f"Backed up to {backup_path}")

        img = Image.open(image_path)
        width, height = img.size
        
        crop_width = int(width * percentage)
        
        # Crop from left and right
        # (left, top, right, bottom)
        box = (crop_width, 0, width - crop_width, height)
        cropped_img = img.crop(box)
        
        cropped_img.save(image_path)
        print(f"Cropped {percentage*100}% from sides of {os.path.basename(image_path)}")
        
    except Exception as e:
        print(f"Error processing {image_path}: {e}")

base_path = r"e:\IT 4.5\IT 4.5\itroots\public\images\projects\data-analytics-python"
images = [
    "Expense & Revenue Dashboard.png",
    "Public Transport Performance.png"
]

for img in images:
    crop_sides(os.path.join(base_path, img))
