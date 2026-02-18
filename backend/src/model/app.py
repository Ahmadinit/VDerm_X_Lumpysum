from flask import Flask, request, jsonify
import base64
from io import BytesIO
from PIL import Image
import numpy as np
from tensorflow.keras.models import load_model

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB
# Step 2.1: Load the model once when the server starts
model = load_model('final_model.keras')
# Check the input shape of the model
print("Model Input Shape:", model.input_shape)

def preprocess_image(image_data):
    # Decode the base64 image
    image_data = base64.b64decode(image_data)
    image = Image.open(BytesIO(image_data)).convert('RGB')
    image = image.resize((256, 256))  # Resize to 256x256 as expected by the model
    image = np.array(image) / 255.0  # Normalize pixel values
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image


@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Step 2.3: Read base64 image from the request
        data = request.json
        image_data = data['image']

        # Step 2.4: Preprocess the image
        image = preprocess_image(image_data)

        # Step 2.5: Make a prediction
        prediction = model.predict(image)

        # Step 2.6: Send the prediction back as JSON
        return jsonify({'prediction': prediction.tolist()})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(port=5000)  # Step 2.7: Run the server on port 5000
