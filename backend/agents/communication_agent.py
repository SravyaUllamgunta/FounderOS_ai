import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.agents.gemini_client import generate_structured_output

logger = logging.getLogger("communication_agent")

class CommunicationOutput(BaseModel):
    subject: str = Field(..., description="Subject line for email draft, or a title header for summaries and updates.")
    body: str = Field(..., description="The complete text content of the draft, formatted in clean, editable Markdown.")

def rule_based_draft(
    investor_name: str,
    communication_type: str,
    tone: str,
    meeting_context: str = "",
    founder_message: str = "",
    attachments: Optional[List[str]] = None,
    additional_instructions: str = ""
) -> CommunicationOutput:
    """
    Generates a personalized communication draft by assembling input presets when LLM quota is exhausted.
    """
    logger.info("Executing rule-based local communication draft fallback.")
    if not investor_name:
        investor_name = "Investor"
        
    subject = f"Follow-up: Meeting discussion with {investor_name}"
    if communication_type == "Investor Update":
        subject = f"Progress Update for {investor_name}"
    elif communication_type == "Meeting Summary":
        subject = f"Summary: Meeting with {investor_name}"
    elif communication_type == "Thank-you Email":
        subject = f"Thank you: Meeting with {investor_name}"
        
    body_parts = [
        f"Hi {investor_name},",
        "",
        "Great speaking with you regarding our developer workflow and data pipelines."
    ]
    
    if meeting_context:
        body_parts.append("")
        body_parts.append(meeting_context)
        
    if founder_message:
        body_parts.append("")
        body_parts.append(founder_message)
        
    if additional_instructions:
        body_parts.append("")
        body_parts.append(f"Regarding your specifications: {additional_instructions}")
        
    if attachments:
        body_parts.append("")
        body_parts.append(f"I have enclosed: {', '.join(attachments)}.")
        
    body_parts.append("")
    body_parts.append("Please let me know if you have any questions or would like to schedule a follow-up. Looking forward to our next steps.")
    body_parts.append("")
    body_parts.append("Best regards,")
    body_parts.append("Founder")
    
    return CommunicationOutput(
        subject=subject,
        body="\n".join(body_parts)
    )

SYSTEM_INSTRUCTION = """You are FounderOS's Communication Agent.

Generate investor communications based ONLY on:
1. User supplied data
2. Retrieved context if provided

Never assume:
- investor names
- company names
- previous meetings
- attachments
- fundraising details

If information is missing, generate using only available context.
Ensure the body of the output is formatted in clean, readable, editable Markdown. Incorporate specific context and action items seamlessly.
"""

PROMPT_TEMPLATE = """
Please generate a {communication_type} in a {tone} tone.

Investor Name: {investor_name}
Meeting Context: {meeting_context}
Founder Message: {founder_message}
Attachments: {attachments}
Additional Instructions: {additional_instructions}
"""

def draft_communication(
    investor_name: str,
    communication_type: str,
    tone: str,
    meeting_context: str = "",
    founder_message: str = "",
    attachments: Optional[List[str]] = None,
    additional_instructions: str = "",
    context: str = ""
) -> CommunicationOutput:
    """
    Invokes Gemini to generate a structured communication draft in Markdown.
    """
    if attachments is None:
        attachments = []
        
    if not investor_name or not investor_name.strip():
        investor_name = "Investor"
    if not communication_type:
        communication_type = "Follow-up Email"
    if not tone:
        tone = "Professional"
    
    # Map compatibility context argument if meeting_context is empty
    m_ctx = meeting_context if meeting_context else context

    prompt = PROMPT_TEMPLATE.format(
        communication_type=communication_type,
        tone=tone,
        investor_name=investor_name,
        meeting_context=m_ctx or "No context provided.",
        founder_message=founder_message or "No message specified.",
        attachments=", ".join(attachments) if attachments else "None",
        additional_instructions=additional_instructions or "None"
    )
    
    fallback = rule_based_draft(
        investor_name=investor_name,
        communication_type=communication_type,
        tone=tone,
        meeting_context=m_ctx,
        founder_message=founder_message,
        attachments=attachments,
        additional_instructions=additional_instructions
    )
    
    return generate_structured_output(
        prompt=prompt,
        response_schema=CommunicationOutput,
        system_instruction=SYSTEM_INSTRUCTION,
        mock_fallback_data=fallback
    )
