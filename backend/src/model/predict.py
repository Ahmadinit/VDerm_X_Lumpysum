import sys
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model
import tensorflow as tf

# Load the model
model = load_model('final_model.keras')


def preprocess_image(image_data):
    # Decode the base64 image
    image_data = base64.b64decode(image_data)
    image = Image.open(BytesIO(image_data)).convert('RGB')  # Ensure RGB format
    image = image.resize((256, 256))  # Resize to 256x256
    image = np.array(image) / 255.0  # Normalize pixel values
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

# Read the image from stdin (sent by Node.js)
image_data = sys.stdin.read()

# Preprocess image and make prediction
image = preprocess_image(image_data)
prediction = model.predict(image)

# Return the prediction as JSON
print(prediction.tolist())  # Convert numpy array to list for JSON serialization

