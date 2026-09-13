import re
from typing import List, Optional

# Regular expression for splitting text into sentences across multiple languages
# (including the Indic purna viram, U+0964).
SENTENCE_SPLIT_REGEX = re.compile(r'(?<=[.?!\u0964\n])\s+')

def estimate_tokens(text: str) -> int:
    """
    Fast conservative token estimation for multilingual text.
    For Latin text, 1 word ~= 1.3 tokens.
    For Indic / non-Latin scripts, characters often map to 1-2 subword tokens.
    """
    words = text.split()
    word_count = len(words)
    # Check if there is non-ascii text
    has_non_ascii = any(ord(c) > 127 for c in text)
    if has_non_ascii:
        return max(int(word_count * 2.0), int(len(text) / 3))
    return int(word_count * 1.3) + 5

def chunk_text(
    text: str, 
    max_tokens: int = 512, 
    tokenizer = None
) -> List[str]:
    """
    Chunks text into segments guaranteed to be under max_tokens.
    Preserves sentence boundaries wherever possible.
    """
    text = text.strip()
    if not text:
        return []

    # Use fast conservative token estimation to avoid expensive CPU tokenizer roundtrips
    def get_token_count(s: str) -> int:
        return estimate_tokens(s)

    current_tokens = get_token_count(text)
    if current_tokens <= max_tokens:
        return [text]

    # Split by paragraphs first
    paragraphs = [p for p in text.split("\n") if p.strip()]
    chunks: List[str] = []
    current_chunk: List[str] = []
    accumulated_tokens = 0

    for para in paragraphs:
        para_tokens = get_token_count(para)
        
        # If the paragraph itself fits
        if para_tokens <= max_tokens:
            if accumulated_tokens + para_tokens <= max_tokens:
                current_chunk.append(para)
                accumulated_tokens += para_tokens
            else:
                if current_chunk:
                    chunks.append("\n".join(current_chunk))
                current_chunk = [para]
                accumulated_tokens = para_tokens
        else:
            # Paragraph is too big, split into sentences
            sentences = SENTENCE_SPLIT_REGEX.split(para)
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                sent_tokens = get_token_count(sent)
                
                if sent_tokens > max_tokens:
                    # Single sentence exceeds limit! Split by word or comma
                    sub_parts = re.split(r'([,;:\-–—])', sent)
                    temp_sub = ""
                    for sp in sub_parts:
                        sp_tokens = get_token_count(temp_sub + sp)
                        if sp_tokens <= max_tokens:
                            temp_sub += sp
                        else:
                            if temp_sub.strip():
                                if current_chunk:
                                    current_chunk.append(temp_sub.strip())
                                    chunks.append(" ".join(current_chunk))
                                    current_chunk = []
                                    accumulated_tokens = 0
                                else:
                                    chunks.append(temp_sub.strip())
                            temp_sub = sp
                    if temp_sub.strip():
                        current_chunk.append(temp_sub.strip())
                        accumulated_tokens += get_token_count(temp_sub)
                else:
                    if accumulated_tokens + sent_tokens <= max_tokens:
                        current_chunk.append(sent)
                        accumulated_tokens += sent_tokens
                    else:
                        if current_chunk:
                            chunks.append(" ".join(current_chunk))
                        current_chunk = [sent]
                        accumulated_tokens = sent_tokens

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return [c.strip() for c in chunks if c.strip()]
