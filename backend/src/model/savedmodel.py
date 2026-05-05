from tensorflow.keras.models import load_model

# Load your model
model = load_model('final_model.keras')

# Export the model in SavedModel format
model.export('C:/Fypbackend/backend/src/model/saved_model')
