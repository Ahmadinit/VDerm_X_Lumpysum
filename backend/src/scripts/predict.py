import tensorflow as tf
from tensorflow.keras.models import load_model # type: ignore
import numpy as np
import sys
import os
from PIL import Image
import json

# Suppress TensorFlow logs and warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging (error only)
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations warnings

# Ensure the model is loaded from the same folder as the script
script_dir = os.path.dirname(os.path.abspath(__file__))  # Get the current script directory
model_path = os.path.join(script_dir, 'final_model.keras')  # Model is in the same directory as the script

# Check if the model file exists
if not os.path.exists(model_path):
    raise ValueError(f"Model file not found: {model_path}")

# Load the model
model = load_model(model_path)

def preprocess_image(image_path):
    """
    Preprocess the image to be suitable for the model's input.
    Args:
    - image_path: Path to the image file.

    Returns:
    - Preprocessed image ready for prediction.
    """
    try:
        # Open image using PIL
        img = Image.open(image_path)
        img = img.resize((256, 256))  # Resize to match the expected input size
        img = img.convert('RGB')  # Ensure image is in RGB format
        img = np.array(img)  # Convert the image to a numpy array
        img = img / 255.0  # Normalize the image to [0, 1] range if required by your model
        img = np.expand_dims(img, axis=0)  # Add batch dimension (1, 256, 256, 3)
        return img
    except Exception as e:
        raise ValueError(f"Error processing image: {e}")

def predict(image_path):
    """
    Preprocess the image and make a prediction.
    Args:
    - image_path: Path to the image file.

    Returns:
    - Dictionary-formatted prediction result with classification.
    """
    img = preprocess_image(image_path)
    
    try:
        # Suppress model.predict progress logs
        result = model.predict(img, verbose=0)  # Disable verbose logs during prediction
        
        # Extract probabilities
        probabilities = result[0]  # Assuming result is of shape (1, 2)

        # Determine classification
        if probabilities[0] < 0.5 and probabilities[1] > 0.5:
            classification = "Not Lumpy Skin"
        else:
            classification = "Lumpy Skin"

        # Format result as a dictionary
        prediction_output = {
            "prediction": probabilities.tolist(),  # Convert numpy array to a serializable list
            "classification": classification
        }
        return prediction_output  # Return dictionary
    except Exception as e:
        raise RuntimeError(f"Error during prediction: {e}")


if __name__ == "__main__":
    # Ensure the script is run with the correct argument
    if len(sys.argv) != 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    # Get the image path from command line argument
    image_path = sys.argv[1]
    
    # Check if the image file exists at the given path
    if not os.path.exists(image_path):
        print(f"Error: Image file does not exist at {image_path}")
        sys.exit(1)

    try:
        # Make the prediction and output the result
        prediction_output = predict(image_path)  # Get dictionary result
        print(json.dumps(prediction_output, indent=4))  # Convert to JSON for printing
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
