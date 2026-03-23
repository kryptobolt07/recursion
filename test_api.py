import urllib.request
try:
    response = urllib.request.urlopen("http://127.0.0.1:8000/strategy/report/demo-techforge?force=true")
    print(response.read())
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read())
