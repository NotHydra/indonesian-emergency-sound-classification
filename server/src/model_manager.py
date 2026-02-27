"""Model loading and management with lazy loading and singleton pattern."""

import os
from typing import Optional

import keras

from utilities.logger import Logger


class ModelManager:
    """Manages model loading with lazy loading and singleton pattern."""

    _instance: Optional["ModelManager"] = None
    _model: Optional[keras.Model] = None
    _model_path: str = "model.h5"
    _is_loaded: bool = False

    def __new__(cls) -> "ModelManager":
        """Ensure only one instance exists (singleton pattern)."""
        
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            
        return cls._instance

    @classmethod
    def get_instance(cls) -> "ModelManager":
        """Get the singleton instance."""
        
        return cls()

    def load_model(self) -> keras.Model:
        """Load the model (only once, cached thereafter)."""
        
        if self._is_loaded and self._model is not None:
            return self._model

        try:
            if not os.path.exists(self._model_path):
                error_msg = f"Model file not found: {self._model_path}"
        
                Logger.error(f"[ModelManager] {error_msg}")
        
                raise FileNotFoundError(error_msg)

            Logger.debug(f"[ModelManager] Loading model from {self._model_path}")
        
            self._model = keras.models.load_model(self._model_path)
            self._is_loaded = True
        
            Logger.debug("[ModelManager] Model loaded successfully")
        
            return self._model

        except Exception as e:
            Logger.error(f"[ModelManager] Failed to load model: {e}")
            
            raise

    def get_model(self) -> keras.Model:
        """Get the cached model, or load it if not already loaded."""
        
        if not self._is_loaded:
            return self.load_model()
        
        return self._model

    def is_model_loaded(self) -> bool:
        """Check if model is currently loaded."""
        
        return self._is_loaded

    def unload_model(self) -> None:
        """Unload the model from memory."""
        
        self._model = None
        self._is_loaded = False
        
        Logger.debug("[ModelManager] Model unloaded")


# Global model manager instance
model_manager = ModelManager.get_instance()
