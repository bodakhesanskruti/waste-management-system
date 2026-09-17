import cv2
import numpy as np
import onnxruntime as ort


MODEL_PATH = "ai_model/mobilenetv2.onnx"


# Load MobileNetV2 ONNX model
session = ort.InferenceSession(
    MODEL_PATH,
    providers=["CPUExecutionProvider"]
)

input_name = session.get_inputs()[0].name


# Waste categories
categories = [
    "Organic/Wet Waste",
    "Dry/Recyclable Waste",
    "Plastic",
    "E-Waste",
    "Hazardous Waste"
]


def classify_image(image_path):

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Unable to read image")

    # MobileNetV2 input size
    image = cv2.resize(image, (224, 224))

    # Convert BGR → RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Normalize image
    image = image.astype(np.float32) / 255.0

    # ImageNet normalization
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])

    image = (image - mean) / std

    # HWC → CHW
    image = np.transpose(image, (2, 0, 1))

    # Add batch dimension
    image = np.expand_dims(image, axis=0)

    # AI prediction
    output = session.run(None, {
        input_name: image
    })

    prediction = np.argmax(output[0])

    # Prototype category mapping
    waste_type = categories[
        prediction % len(categories)
    ]

    return waste_type