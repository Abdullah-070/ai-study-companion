"""
YouTube Service - Fetch transcripts and metadata from YouTube videos
"""
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from typing import Optional, Dict, Tuple
import re


class YouTubeService:
    """Service for fetching YouTube video transcripts and metadata."""
    
    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """Extract video ID from various YouTube URL formats."""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    @staticmethod
    def get_transcript(video_id: str, languages: list = None) -> Tuple[str, float]:
        """
        Fetch transcript for a YouTube video.
        
        Args:
            video_id: YouTube video ID
            languages: Preferred languages (defaults to ['en'])
            
        Returns:
            Tuple of (transcript_text, duration_seconds)
        """
        if languages is None:
            languages = ['en']
        
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        except NoTranscriptFound:
            # Try auto-generated transcripts
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine transcript parts
        full_text = ' '.join([entry['text'] for entry in transcript_list])
        
        # Calculate total duration
        if transcript_list:
            last_entry = transcript_list[-1]
            duration = last_entry['start'] + last_entry.get('duration', 0)
        else:
            duration = 0
        
        return full_text, duration
    
    @staticmethod
    def get_video_info(url: str) -> Dict:
        """Get basic video information from URL."""
        video_id = YouTubeService.extract_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")
        
        return {
            'video_id': video_id,
            'url': url,
            'embed_url': f'https://www.youtube.com/embed/{video_id}'
        }


# Singleton instance
youtube_service = YouTubeService()
