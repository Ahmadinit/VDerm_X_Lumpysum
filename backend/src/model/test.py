import requests
import base64

# Step 4.1: Read and encode the image in base64
with open('imag2.png', 'rb') as f:  # Replace 'image.jpg' with your image file
    image_data = base64.b64encode(f.read()).decode('utf-8')
    print(image_data)
# Step 4.2: Send the base64 image to the server
response = requests.post('http://127.0.0.1:5000/predict', json={'image': image_data})

# Step 4.3: Print the server's response
print(response.json())
