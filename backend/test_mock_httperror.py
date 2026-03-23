import urllib.request
import json
import threading

def fetch():
    try:
        r = urllib.request.urlopen("http://127.0.0.1:8000/strategy/report/demo-techforge?force=true")
        print("Success!")
    except Exception as e:
        print("Error:", e)
        if hasattr(e, 'read'):
            print(e.read().decode())

def patch_data_api():
    from app.services.youtube.data_api import YouTubeDataAPI
    from googleapiclient.errors import HttpError
    orig = YouTubeDataAPI.get_comments
    
    async def mock_get_comments(self, video_id, max_pages=2):
        print(f"Mocking HttpError for video {video_id}!")
        import httplib2
        raise HttpError(httplib2.Response({'status': 403}), b'{"error": {"errors": [{"reason": "commentsDisabled"}]}}')
    
    YouTubeDataAPI.get_comments = mock_get_comments

# Wait, the backend server is running in another process! So we can't patch it this way!
