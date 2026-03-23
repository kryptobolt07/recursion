import urllib.request
import threading

def fetch(url):
    try:
        r = urllib.request.urlopen(url)
        print(f"{url} returned {r.status}")
    except Exception as e:
        print(f"{url} Error: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode())

threads = [
    threading.Thread(target=fetch, args=("http://127.0.0.1:8000/strategy/report/demo-techforge?force=true",)),
    threading.Thread(target=fetch, args=("http://127.0.0.1:8000/strategy/posting/demo-techforge?force=true",))
]

for t in threads: t.start()
for t in threads: t.join()
