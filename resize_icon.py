import os
from PIL import Image

def pad_and_resize(image_path, scale=0.6):
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size
    
    # Calculate new size
    new_w = int(w * scale)
    new_h = int(h * scale)
    
    # Resize image
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create new image with original size and transparent background
    new_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    # Paste resized image into the center
    paste_x = (w - new_w) // 2
    paste_y = (h - new_h) // 2
    new_img.paste(resized, (paste_x, paste_y), resized)
    
    # Save back
    new_img.save(image_path)
    print(f"Successfully zoomed out {image_path}")

if __name__ == "__main__":
    icon_path = os.path.join("assets", "adaptive-icon.png")
    if os.path.exists(icon_path):
        pad_and_resize(icon_path)
    else:
        print("Icon not found at", icon_path)
