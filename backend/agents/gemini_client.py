import os
import logging
from typing import Type, TypeVar, Optional
from pydantic import BaseModel
from backend.app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gemini_client")

T = TypeVar("T", bound=BaseModel)

# Try importing the new google-genai SDK
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    logger.warning("google-genai SDK not importable. Falling back to simulation mode.")
    GENAI_AVAILABLE = False

def get_gemini_client():
    if not GENAI_AVAILABLE:
        return None
    
    api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set. Agents will run in SIMULATION/MOCK mode.")
        return None
    
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Error initializing Gemini client: {e}. Falling back to MOCK mode.")
        return None

def generate_structured_output(
    prompt: str,
    response_schema: Type[T],
    system_instruction: Optional[str] = None,
    mock_fallback_data: Optional[T] = None,
    request_id: Optional[str] = None
) -> T:
    """
    Sends a structured generation prompt to Gemini 2.5 Flash.
    Enforces the return format using the provided Pydantic response_schema.
    If the API key is missing or an error occurs, falls back to mock_fallback_data.
    """
    client = get_gemini_client()
    
    req_prefix = f"[{request_id}] " if request_id else ""
    
    if not client:
        if mock_fallback_data is not None:
            logger.info(f"{req_prefix}Running in SIMULATION mode: returned pre-defined Pydantic fallback data.")
            return mock_fallback_data
        raise ValueError("Gemini client is not initialized and no mock fallback data was provided.")

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=response_schema,
        system_instruction=system_instruction,
        temperature=0.2,
    )
    
    max_retries = 2
    last_exception = None
    
    for attempt in range(max_retries + 1):
        try:
            logger.info(f"{req_prefix}Invoking Gemini 2.5 Flash for structured output (attempt {attempt + 1})...")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=config
            )
            
            if not response.text:
                raise ValueError("Received empty text response from Gemini API.")
                
            logger.info(f"{req_prefix}Gemini response received")
            
            # Parse json and validate using Pydantic
            result_obj = response_schema.model_validate_json(response.text)
            result_dict = result_obj.model_dump()
            
            # Validation checks:
            summary_val = result_dict.get("summary")
            questions_val = result_dict.get("questions") or result_dict.get("questions_asked")
            action_items_val = result_dict.get("actionItems") or result_dict.get("action_items") or result_dict.get("next_steps")
            concerns_val = result_dict.get("concerns") or result_dict.get("investor_concerns")
            
            is_empty_analysis = (
                not summary_val
                and not questions_val
                and not action_items_val
                and not concerns_val
            )
            if is_empty_analysis:
                raise ValueError("Analysis appears empty.")
                
            INVALID_PLACEHOLDERS = {"Investor", "Founder", "VC Firm", "Unknown"}
            if result_dict.get("investor_name") in INVALID_PLACEHOLDERS:
                raise ValueError("Placeholder investor returned.")
            if result_dict.get("summary") == "No summary extracted.":
                raise ValueError("Fallback summary detected.")
                
            logger.info(f"{req_prefix}Successfully validated response from Gemini API.")
            return result_obj
            
        except Exception as e:
            logger.error(f"{req_prefix}Structured output attempt {attempt + 1} failed: {e}")
            last_exception = e
            if attempt < max_retries:
                logger.info(f"{req_prefix}Retrying structured generation...")
                continue
                
    # If we get here, all attempts failed
    if mock_fallback_data is not None:
        logger.info(f"{req_prefix}Falling back to SIMULATION mode due to API error after all attempts.")
        return mock_fallback_data
        
    raise last_exception
