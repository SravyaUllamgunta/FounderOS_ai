import numpy as np
from backend.app.config import settings

# Initialize local embedding model lazily
_model = None

def get_embedding_model():
    global _model
    if _model is None:
        try:
            # Lazy import to avoid loading heavy numpy/scipy/sklearn numerical packages at startup
            from sentence_transformers import SentenceTransformer
            # Load lightweight 384-dim sentence transformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            print("Loaded local SentenceTransformer model.")
        except Exception as e:
            print(f"Skipping SentenceTransformer load: {e}. Using deterministic mock vector generator.")
            class MockModel:
                def encode(self, text):
                    # Deterministic mock 384-dim vector using hash value of text
                    np.random.seed(hash(text) % (2**32))
                    return np.random.randn(384).tolist()
            _model = MockModel()
    return _model

# Initialize Qdrant Client
qdrant_client = None
if settings.QDRANT_URL and settings.QDRANT_API_KEY:
    try:
        from qdrant_client import QdrantClient
        
        qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        print("Successfully initialized connection to Qdrant Cloud.")
    except Exception as e:
        print(f"Failed to initialize Qdrant Client: {e}")

COLLECTION_NAME = f"{settings.QDRANT_COLLECTION_PREFIX}_investors"

def init_qdrant():
    if qdrant_client is None:
        print("Qdrant client not initialized. Skipping vector collection setup.")
        return

    try:
        from qdrant_client.http import models as qmodels
        collections = qdrant_client.get_collections().collections
        exists = any(c.name == COLLECTION_NAME for c in collections)
        
        if not exists:
            print(f"Creating Qdrant collection: {COLLECTION_NAME}...")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=qmodels.VectorParams(
                    size=384, # MiniLM vector size
                    distance=qmodels.Distance.COSINE
                )
            )
            print("Collection created successfully.")
        else:
            print(f"Collection {COLLECTION_NAME} already exists.")
    except Exception as e:
        print(f"Error initializing Qdrant collection: {e}")

def index_investor_profile(investor_id: str, text_content: str, payload: dict):
    """
    Generate embedding and upsert profile to Qdrant.
    """
    if qdrant_client is None:
        return False
    
    try:
        from qdrant_client.http import models as qmodels
        model = get_embedding_model()
        vector = model.encode(text_content)
        if isinstance(vector, np.ndarray):
            vector = vector.tolist()

        try:
            point_id = int(investor_id.replace("p", "").strip())
        except ValueError:
            point_id = hash(investor_id) % (2**63 - 1)

        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                qmodels.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "investor_id": investor_id,
                        "text": text_content,
                        **payload
                    }
                )
            ]
        )
        return True
    except Exception as e:
        print(f"Error indexing investor profile in Qdrant: {e}")
        return False

def search_investors_semantic(query: str, limit: int = 5):
    """
    Search Qdrant for matching investors.
    """
    if qdrant_client is None:
        print("Qdrant client is not available for search.")
        return []

    try:
        model = get_embedding_model()
        vector = model.encode(query)
        if isinstance(vector, np.ndarray):
            vector = vector.tolist()

        res = qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=vector,
            limit=limit
        )

        return [
            {
                "investor_id": r.payload.get("investor_id"),
                "score": r.score,
                "text": r.payload.get("text"),
                "name": r.payload.get("name"),
                "firm": r.payload.get("firm")
            }
            for r in res.points
        ]
    except Exception as e:
        print(f"Error searching Qdrant: {e}")
        return []
