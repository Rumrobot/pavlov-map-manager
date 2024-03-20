from PIL import Image
import os

def scale_image(input_path, output_path, size):
    with Image.open(input_path) as img:
        img_resized = img.resize((size, size))
        img_resized.save(output_path)

def main(input_file):
    sizes = {
        "32x32.png": 32,
        "128x128.png": 128,
        "128x128@2.png": 256,
        "icon.png": 512,
        "Square30x30Logo.png": 30,
        "Square44x44Logo.png": 44,
        "Square71x71Logo.png": 71,
        "Square89x89Logo.png": 89,
        "Square107x107Logo.png": 107,
        "Square142x142Logo.png": 142,
        "Square150x150Logo.png": 150,
        "Square284x284Logo.png": 284,
        "Square310x310Logo.png": 310,
        "StoreLogo.png": 50
    }
    
    # Ensure the input file exists
    if not os.path.exists(input_file):
        print(f"Input file '{input_file}' not found.")
        return
    
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(os.path.abspath(input_file))
    
    # Load the ICO file
    input_path = os.path.abspath(input_file)
    
    # Iterate over required sizes
    for filename, size in sizes.items():
        output_path = os.path.join(output_dir, filename)
        scale_image(input_path, output_path, size)
        print(f"Image scaled to {size}x{size}: {output_path}")

if __name__ == "__main__":
    input_file = input("Enter the path to the ICO file: ")
    main(input_file)
