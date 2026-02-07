"""
Utility functions for AI Study Companion
"""


def format_duration(seconds: int) -> str:
    """Format seconds into a human-readable duration string."""
    if seconds < 60:
        return f"{seconds} seconds"
    elif seconds < 3600:
        minutes = seconds // 60
        remaining_seconds = seconds % 60
        if remaining_seconds:
            return f"{minutes}m {remaining_seconds}s"
        return f"{minutes} minutes"
    else:
        hours = seconds // 3600
        remaining_minutes = (seconds % 3600) // 60
        if remaining_minutes:
            return f"{hours}h {remaining_minutes}m"
        return f"{hours} hours"


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text to a maximum length with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."


def calculate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """Calculate estimated reading time in minutes."""
    word_count = len(text.split())
    return max(1, round(word_count / words_per_minute))
