import os
import sys

# Add the packages/api-fastapi directory to the python path so it can import main and data_store
sys.path.append(os.path.join(os.path.dirname(__file__), "packages", "api-fastapi"))

import gradio as gr
from main import app as fastapi_app

# Simple dashboard for the Gradio Space landing page
with gr.Blocks(title="FloatChat Backend") as demo:
    gr.Markdown("# 🌊 FloatChat AI Backend Server")
    gr.Markdown("The Python FastAPI backend is successfully running on Hugging Face Spaces!")
    gr.Markdown("### 🔗 Connection Info")
    gr.Markdown("To connect your frontend deployed on Netlify, add the following Environment Variable in Netlify:")
    gr.Markdown("- **Key**: `REACT_APP_CHAT_API_URL`\n- **Value**: `https://sarvesh7979-floatchat-api.hf.space` *(Replace with your actual Space URL)*")

# Mount Gradio onto the FastAPI app so both run together on the same port
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
