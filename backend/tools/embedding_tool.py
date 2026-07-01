import logging

logger = logging.getLogger("embedding_tool")

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except (ImportError, MemoryError) as e:
    logger.warning(f"SentenceTransformers could not be loaded ({e}). Using mock embeddings.")
    HAS_SENTENCE_TRANSFORMERS = False

class EmbeddingTool:
    _model = None

    @classmethod
    def get_model(cls):
        """Loads and caches the sentence-transformers model locally as a singleton."""
        if not HAS_SENTENCE_TRANSFORMERS:
            return None
        if cls._model is None:
            try:
                # This loads the model or downloads it (approx. 90MB) on first execution
                cls._model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.warning(f"Failed to load SentenceTransformer model: {e}. Falling back to mock.")
                return None
        return cls._model

    @classmethod
    def generate_embedding(cls, text: str) -> list:
        """Generates 384-dimension vector list for semantic search."""
        model = cls.get_model()
        if model is None:
            import random
            # Generate a deterministic pseudo-random mock vector of size 384
            random.seed(hash(text))
            return [random.uniform(-1.0, 1.0) for _ in range(384)]
        
        try:
            embeddings = model.encode(text)
            return embeddings.tolist()
        except Exception as e:
            logger.warning(f"Encoding failed: {e}. Returning fallback mock vector.")
            import random
            random.seed(hash(text))
            return [random.uniform(-1.0, 1.0) for _ in range(384)]
