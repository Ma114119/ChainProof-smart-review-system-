import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import os

# --- 1. CONFIGURATION ---
# Set HF_TOKEN in environment or .env for Llama model access
# Use None (not "") when empty — "Bearer " with no token causes "Illegal header value" error
HF_TOKEN = os.environ.get("HF_TOKEN") or None
if HF_TOKEN:
    HF_TOKEN = str(HF_TOKEN).strip() or None  # Remove whitespace that can break headers
# This version is only ~2.5GB!
BASE_MODEL = "meta-llama/Llama-3.2-1B-Instruct" 

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ADAPTER_PATH = os.path.join(BASE_DIR, 'ai_weights')

# Initialize before try block — if loading fails, these stay None so we can handle gracefully
tokenizer = None
model = None

print("Starting the 'Lite' Engine (Perfect for your drive space)...")

try:
    # 1. Load Tokenizer
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, token=HF_TOKEN)
    
    # 2. Load Model on CPU (Safe & Fast)
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, 
        torch_dtype=torch.float32, 
        device_map={"": "cpu"},
        token=HF_TOKEN
    )

    # 3. Attach your "Brain" (The weights you unzipped)
    # We use 'safe_merge' to ensure it doesn't crash
    model = PeftModel.from_pretrained(model, ADAPTER_PATH)
    print("✔ SUCCESS! AI is alive and fits perfectly on your drive.")

except Exception as e:
    print(f"Error: {e}")
    if "401" in str(e) or "Unauthorized" in str(e) or "gated" in str(e).lower():
        print("  → Llama is a gated model. Set HF_TOKEN in .env with your Hugging Face token.")


PROFANITY_LIST = [
    "fucking", "fuck", "shit", "bullshit", "idiot", "stupid",
    "bastard", "damn", "hell", "asshole", "bitch", "crap",
    "moron", "dumb", "loser", "trash", "garbage", "scam", "scammer",
]

def _contains_profanity(text):
    lower = text.lower()
    return any(word in lower for word in PROFANITY_LIST)


# --- 1. REVIEW SUGGESTION GENERATOR ---
def generate_review_suggestion(business_name, business_category, sentiment_type):
    if tokenizer is None or model is None:
        raise RuntimeError("AI model failed to load at startup. Check server logs for details.")

    instruction = f"Write a 2-sentence {sentiment_type} review for a {business_category} named {business_name}. Output ONLY the review text."

    prompt = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
        f"You are a concise review writer. Output ONLY the review, nothing else.<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n{instruction}<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            max_new_tokens=50,
            do_sample=False,       # greedy — much faster than sampling
            temperature=1.0,       # ignored when do_sample=False
            repetition_penalty=1.1,
        )

    return tokenizer.decode(outputs[0], skip_special_tokens=True).split("assistant")[-1].strip()


# --- 2. REVIEW SANITIZER ---
def rewrite_unethical_review(raw_text):
    # Skip AI entirely if the review is already clean — fastest path
    if not _contains_profanity(raw_text):
        return raw_text

    if tokenizer is None or model is None:
        # AI unavailable — return raw text with profanity stripped as fallback
        clean_text = raw_text.lower()
        for word in PROFANITY_LIST:
            clean_text = clean_text.replace(word, "[unprofessional term]")
        return clean_text if clean_text.strip() else raw_text

    # Replace profanity with neutral placeholders
    clean_text = raw_text.lower()
    for word in PROFANITY_LIST:
        clean_text = clean_text.replace(word, "[unprofessional term]")

    instruction = (
        "Rewrite this user feedback professionally in 2 sentences. "
        "Keep the original sentiment. Output ONLY the rewritten text. "
        f"Feedback: '{clean_text}'"
    )

    prompt = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
        f"You are a content sanitizer. Output ONLY cleaned text.<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n{instruction}<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.inference_mode():
        outputs = model.generate(
            **inputs,
            max_new_tokens=50,
            do_sample=False,
            temperature=1.0,
            repetition_penalty=1.1,
        )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True).split("assistant")[-1].strip()

    if not result or "cannot fulfill" in result.lower() or "i can't" in result.lower():
        return "The experience did not meet professional standards and fell significantly short of expectations."

    return result