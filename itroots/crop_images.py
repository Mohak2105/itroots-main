from PIL import Image
import os

def is_green(r, g, b):
    # Heuristic for greenish color: Green is dominant
    return g > r + 15 and g > b + 15

def crop_green_borders(image_path):
    try:
        if not os.path.exists(image_path):
            print(f"File not found: {image_path}")
            return

        img = Image.open(image_path)
        img = img.convert("RGB")
        width, height = img.size
        pixels = img.load()

        # Scan 3 horizontal lines: 25%, 50%, 75% height
        lines_y = [height // 4, height // 2, (height * 3) // 4]
        
        left_crops = []
        right_crops = []

        for y in lines_y:
            # Left side scan
            l_crop = 0
            for x in range(width // 3): # Only scan first 1/3
                r, g, b = pixels[x, y]
                if is_green(r, g, b):
                    l_crop = x + 1
                else:
                    break # Stop when non-green found
            left_crops.append(l_crop)
            
            # Right side scan
            r_crop = width
            for x in range(width - 1, (width * 2) // 3, -1): # Only scan last 1/3
                r, g, b = pixels[x, y]
                if is_green(r, g, b):
                    r_crop = x
                else:
                    break
            right_crops.append(r_crop)

        # Use the median crop values to be robust
        left_crops.sort()
        right_crops.sort()
        final_left = left_crops[1]  # Median of 3
        final_right = right_crops[1] # Median of 3

        # Only crop if we detected borders
        if final_left > 0 or final_right < width:
            print(f"Cropping {os.path.basename(image_path)}: Left {final_left}, Right {width - final_right}")
            cropped_img = img.crop((final_left, 0, final_right, height))
            cropped_img.save(image_path)
            print("Successfully saved cropped image.")
        else:
            print(f"No green borders detected for {os.path.basename(image_path)} (Left: {final_left}, Right: {final_right}).")

    except Exception as e:
        print(f"Error processing {image_path}: {e}")

base_path = r"e:\IT 4.5\IT 4.5\itroots\public\images\projects\data-analytics-python"
images = [
    "Expense & Revenue Dashboard.png",
    "Public Transport Performance.png"
]

for img_name in images:
    full_path = os.path.join(base_path, img_name)
    print(f"Processing {full_path}...")
    crop_green_borders(full_path)
