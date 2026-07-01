import os
import sys

# Ensure backend directory is in python search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.tools.qdrant_tool import QdrantTool
from backend.tools.embedding_tool import EmbeddingTool

def test_qdrant():
    print("Testing Qdrant Cloud connection & Embedding generator...")
    try:
        # 1. Initialize tools
        qdrant = QdrantTool()
        
        # 2. Make sure collections are set up
        print("Verifying/creating collections...")
        qdrant.ensure_collections()
        
        # 3. Generate embedding vector
        sample_text = "Looking for Pre-Seed AI or SaaS startups doing under 1M ARR."
        print(f"Generating embedding for text: '{sample_text}'")
        vector = EmbeddingTool.generate_embedding(sample_text)
        print(f"Embedding generated. Dimensions: {len(vector)} (Expected: 384)")
        
        # 4. Upsert temporary test vector (id=999999)
        print("Upserting sample vector into 'investor_memories' collection...")
        qdrant.upsert_vector(
            collection="investor_memories",
            point_id=999999,
            vector=vector,
            payload={"memory": sample_text, "investor_id": 999}
        )
        
        # 5. Search
        print("Running similarity search...")
        search_res = qdrant.search_vectors(
            collection="investor_memories",
            query_vector=vector,
            limit=1
        )
        
        if search_res:
            found = search_res[0]
            print(f"Success! Found matching point ID: {found.id} with cosine similarity score: {found.score:.4f}")
            print(f"Payload: {found.payload}")
        else:
            print("Warning: Search completed but no matches returned.")
            
        # 6. Clean up
        print("Deleting sample vector (ID 999999)...")
        qdrant.delete_vector(collection="investor_memories", point_id=999999)
        print("Qdrant verification complete.")
    except Exception as e:
        print("Qdrant test execution failed:", e)

if __name__ == "__main__":
    test_qdrant()
