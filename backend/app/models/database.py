"""Supabase table definitions — mirrors the data models from Project.md §3.3.

These define the expected schema. Actual table creation happens in Supabase Dashboard or via migrations.
"""

# Table: channels
CHANNELS_SCHEMA = {
    "id": "text primary key",           # YouTube channel ID
    "handle": "text",
    "name": "text",
    "subscriber_count": "integer",
    "total_videos": "integer",
    "join_date": "timestamp",
    "niche_tags": "text[]",             # auto-assigned
    "health_score": "real",
    "last_analyzed_at": "timestamp",
}

# Table: videos
VIDEOS_SCHEMA = {
    "id": "text primary key",           # YouTube video ID
    "channel_id": "text references channels(id)",
    "title": "text",
    "description": "text",
    "tags": "text[]",
    "duration_seconds": "integer",
    "published_at": "timestamp",
    "view_count": "integer",
    "like_count": "integer",
    "comment_count": "integer",
    "transcript": "text",
    "thumbnail_url": "text",
    "niche_tag": "text",
    "cluster_id": "integer",
    "is_estimated": "boolean default false",
}

# Table: thumbnail_features
THUMBNAIL_FEATURES_SCHEMA = {
    "video_id": "text primary key references videos(id)",
    "face": "boolean",
    "face_count": "integer",
    "text_present": "boolean",
    "text_content": "text",
    "word_count": "integer",
    "dominant_colors": "text[]",        # hex values
    "background_complexity": "text",     # low / medium / high
}

# Table: audience_signals
AUDIENCE_SIGNALS_SCHEMA = {
    "id": "uuid primary key default gen_random_uuid()",
    "video_id": "text references videos(id)",
    "sentiment_score": "real",
    "top_keywords": "text[]",
    "top_questions": "text[]",
    "top_praise_themes": "text[]",
    "top_complaint_themes": "text[]",
    "language_distribution": "jsonb",
}

# Table: competitor_relationships
COMPETITOR_RELATIONSHIPS_SCHEMA = {
    "id": "uuid primary key default gen_random_uuid()",
    "your_channel_id": "text references channels(id)",
    "competitor_channel_id": "text references channels(id)",
    "similarity_score": "real",
    "shared_niches": "text[]",
    "discovery_method": "text",
    "discovered_at": "timestamp default now()",
}

# Table: niche_clusters
NICHE_CLUSTERS_SCHEMA = {
    "id": "serial primary key",
    "channel_id": "text references channels(id)",
    "cluster_id": "integer",
    "niche_label": "text",
    "video_count": "integer",
    "avg_views": "integer",
    "color": "text",                    # hex for consistent UI coloring
}

# Table: video_embeddings
VIDEO_EMBEDDINGS_SCHEMA = {
    "video_id": "text primary key references videos(id)",
    "embedding": "vector(384)",          # all-MiniLM-L6-v2 produces 384-dim vectors
}
