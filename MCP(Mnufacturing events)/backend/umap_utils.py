import numpy as np
import umap
import ast

def project_embeddings(embeddings, n_neighbors=15, min_dist=0.1):
    def parse_emb(e):
        emb = e['embedding']
        if isinstance(emb, str):
            # Parse string representation of list
            emb = ast.literal_eval(emb)
        return emb
    X = np.array([parse_emb(e) for e in embeddings])
    reducer = umap.UMAP(n_neighbors=n_neighbors, min_dist=min_dist, random_state=42)
    proj = reducer.fit_transform(X)
    return proj.tolist(), [e['event_type'] for e in embeddings] 