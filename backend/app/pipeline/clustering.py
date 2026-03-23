"""HDBSCAN niche and subniche clustering.

Better than k-means because the number of niches is
discovered from the data — no need to specify k in advance.
"""


class NicheClustering:
    """Cluster videos into niches and subniches using HDBSCAN."""

    def cluster_niches(self, embeddings: list[list[float]], min_cluster_size: int = 5) -> list[int]:
        """First-pass clustering: discover main niches."""
        import hdbscan
        import numpy as np

        clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size)
        labels = clusterer.fit_predict(np.array(embeddings))
        return labels.tolist()

    def cluster_subniches(self, embeddings: list[list[float]], min_cluster_size: int = 3) -> list[int]:
        """Second-pass clustering within a niche for finer subniches."""
        import hdbscan
        import numpy as np

        clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size)
        labels = clusterer.fit_predict(np.array(embeddings))
        return labels.tolist()

    def get_centroid_indices(self, embeddings: list[list[float]], labels: list[int], top_n: int = 5) -> dict[int, list[int]]:
        """Get the top_n most central video indices per cluster (for niche label prompts)."""
        import numpy as np

        arr = np.array(embeddings)
        cluster_centroids = {}
        unique_labels = set(labels)
        unique_labels.discard(-1)  # Remove noise label

        for label in unique_labels:
            mask = np.array(labels) == label
            cluster_vecs = arr[mask]
            centroid = cluster_vecs.mean(axis=0)
            distances = np.linalg.norm(cluster_vecs - centroid, axis=1)
            indices = np.where(mask)[0]
            sorted_idx = indices[np.argsort(distances)]
            cluster_centroids[label] = sorted_idx[:top_n].tolist()

        return cluster_centroids
