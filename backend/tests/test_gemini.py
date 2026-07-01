import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from backend.utils.config import settings

def list_and_test():
    print("Listing available models with your Gemini key...")
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # List models
        models = genai.list_models()
        print("\nAvailable Models:")
        found_models = []
        for m in models:
            print(f"- {m.name} (supports generateContent: {'generateContent' in m.supported_generation_methods})")
            if 'generateContent' in m.supported_generation_methods:
                found_models.append(m.name)
        
        if not found_models:
            print("No models found supporting generateContent.")
            return

        # Test the first found model
        test_model = found_models[0]
        print(f"\nTesting generateContent with model '{test_model}'...")
        model = genai.GenerativeModel(model_name=test_model)
        response = model.generate_content("Say hello in exactly three words")
        print(f"Gemini Response: '{response.text.strip()}'")
        print("Success!")
        
    except Exception as e:
        print("Error listing models:", e)

if __name__ == "__main__":
    list_and_test()
