import os
import httpx

# These are mock stubs for the Hackathon. 
# If API keys are present in .env, they will be used.
# Otherwise, it falls back to a safe demo string.

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

async def translate_to_english_sarvam(regional_text: str) -> str:
    """Uses Sarvam AI to translate Indian regional language to English."""
    if not SARVAM_API_KEY:
        return regional_text  # Fallback
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sarvam.ai/translate",
                json={
                    "input": [regional_text],
                    "source_language_code": "hi-IN",
                    "target_language_code": "en-IN"
                },
                headers={"api-subscription-key": SARVAM_API_KEY}
            )
            data = response.json()
            return data["translated_text"][0]
    except Exception as e:
        print(f"Sarvam translation failed: {e}")
        return regional_text


async def generate_audio_elevenlabs(text: str) -> bytes:
    """Uses ElevenLabs to generate voice from text."""
    if not ELEVENLABS_API_KEY:
        # Return a tiny empty MP3/WAV stub if no key is provided
        return b""
        
    try:
        url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code == 200:
                return response.content
            return b""
    except Exception as e:
        print(f"ElevenLabs generation failed: {e}")
        return b""
