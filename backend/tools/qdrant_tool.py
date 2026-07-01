from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from backend.utils.config import settings

class QdrantTool:
    _collections_ensured = False

    def __init__(self):
        self.client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            prefer_grpc=False
        )
        self.prefix = settings.QDRANT_COLLECTION_PREFIX or "founderos"

    def get_collection_name(self, name: str) -> str:
        return f"{self.prefix}_{name}"

    def ensure_collections_once(self):
        if not QdrantTool._collections_ensured:
            try:
                self.ensure_collections()
                QdrantTool._collections_ensured = True
            except Exception as e:
                print(f"Warning: Deferring Qdrant collection verification due to: {e}")

    def ensure_collections(self):
        """Ensures that the required collections exist in Qdrant and have payload indexes for owner_id."""
        collections = ["investor_memories", "meeting_transcripts", "investor_notes"]
        from qdrant_client.models import PayloadSchemaType
        for col in collections:
            col_name = self.get_collection_name(col)
            try:
                self.client.get_collection(collection_name=col_name)
            except Exception:
                # If collection doesn't exist, create it with 384 dimensions (for sentence-transformers)
                self.client.create_collection(
                    collection_name=col_name,
                    vectors_config=VectorParams(size=384, distance=Distance.Distance.COSINE if hasattr(Distance, "Distance") else Distance.COSINE)
                )
            try:
                self.client.create_payload_index(
                    collection_name=col_name,
                    field_name="owner_id",
                    field_schema=PayloadSchemaType.INTEGER
                )
            except Exception as e:
                print(f"Warning: Failed to create payload index on {col_name}: {e}")
            try:
                self.client.create_payload_index(
                    collection_name=col_name,
                    field_name="investor_id",
                    field_schema=PayloadSchemaType.KEYWORD
                )
            except Exception as e:
                print(f"Warning: Failed to create investor_id payload index on {col_name}: {e}")

    def upsert_vector(self, collection: str, point_id: int, vector: list, payload: dict):
        """Upserts a vector point with metadata payload."""
        self.ensure_collections_once()
        col_name = self.get_collection_name(collection)
        self.client.upsert(
            collection_name=col_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
            ]
        )

    def search_vectors(self, collection: str, query_vector: list, limit: int = 5, filter_dict: dict = None):
        """Performs similarity search against a collection, with optional key-value payload filters using query_points."""
        self.ensure_collections_once()
        col_name = self.get_collection_name(collection)
        
        qdrant_filter = None
        if filter_dict:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            conditions = []
            for key, val in filter_dict.items():
                conditions.append(
                    FieldCondition(
                        key=key,
                        match=MatchValue(value=val)
                    )
                )
            qdrant_filter = Filter(must=conditions)

        response = self.client.query_points(
            collection_name=col_name,
            query=query_vector,
            limit=limit,
            query_filter=qdrant_filter
        )
        return response.points

    def delete_vector(self, collection: str, point_id: int):
        """Removes a vector point by its ID."""
        self.ensure_collections_once()
        col_name = self.get_collection_name(collection)
        self.client.delete(
            collection_name=col_name,
            points_selector=[point_id]
        )
