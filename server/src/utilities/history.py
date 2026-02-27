"""History logging utilities for tracking API requests and classifications."""

import datetime
import json
import os
from typing import Optional


class HistoryLogger:
    """Manages history logging with detailed request and classification information."""

    HISTORY_FILE = "src/history.json"

    @staticmethod
    def get_history() -> list:
        """Load existing history from file."""
        try:
            with open(HistoryLogger.HISTORY_FILE, "r") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
            
        except FileNotFoundError:
            return []
        
        except json.JSONDecodeError:
            # File exists but contains invalid JSON
        
            return []
        
        except Exception as e:
            # Log any other errors and return empty list
        
            print(f"Error reading history file: {e}")
        
            return []

    @staticmethod
    def save_history(data: list) -> None:
        """Save history to file."""
        try:
            os.makedirs(os.path.dirname(HistoryLogger.HISTORY_FILE), exist_ok=True)
            with open(HistoryLogger.HISTORY_FILE, "w") as f:
                json.dump(data, f, indent=4)
                
        except Exception as e:
            print(f"Error saving history file: {e}")

    @staticmethod
    def log_attempt(
        file_name: str,
        file_size: int,
        audio_format: str,
        client_ip: str,
        user_agent: Optional[str],
        success: bool,
        classification_result: Optional[bool] = None,
        confidence: Optional[float] = None,
        error_message: Optional[str] = None,
        processing_time_ms: Optional[float] = None,
    ) -> int:
        """
        Log a classification attempt (success or failure) with detailed information.

        Args:
            file_name: Name of the uploaded file
            file_size: Size of the file in bytes
            audio_format: Audio format (e.g., ".mp3", ".wav")
            client_ip: IP address of the requester
            user_agent: User-Agent header from request
            success: Whether the classification was successful
            classification_result: True if ambulance detected, False if traffic noise
            confidence: Confidence score (0.0-1.0)
            error_message: Error message if classification failed
            processing_time_ms: Processing time in milliseconds

        Returns:
            The ID of the logged attempt
        """
        
        history = HistoryLogger.get_history()

        # Generate next ID
        next_id = 1 if len(history) == 0 else history[-1]["id"] + 1

        # Create entry
        entry = {
            "id": next_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "success": success,
            "file": {
                "name": file_name,
                "size": {
                    "bytes": file_size,
                    "kilobytes": round(file_size / 1024, 2),
                    "megabytes": round(file_size / (1024 * 1024), 2)
                },
                "format": audio_format,
            },
            "requester": {
                "ip_address": client_ip,
                "user_agent": user_agent,
            },
        }

        # Add classification results if successful
        if success and classification_result is not None and confidence is not None:
            entry["classification"] = {
                "result": "ambulance" if classification_result else "traffic_noise",
                "is_ambulance": classification_result,
                "confidence": confidence,
                "confidence_percent": round(confidence * 100, 2),
            }

        # Add error information if failed
        if not success and error_message:
            entry["error"] = {
                "message": error_message,
            }

        # Add processing time if available
        if processing_time_ms is not None:
            entry["processing_time_ms"] = processing_time_ms

        # Save to history
        history.append(entry)
        HistoryLogger.save_history(history)

        return next_id
