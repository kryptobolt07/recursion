import asyncio
import httpx

async def fetch(url):
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.get(url)
        print(f"{url} returned {r.status_code}")
        if r.status_code != 200:
            print(r.text)

async def main():
    await asyncio.gather(
        fetch("http://127.0.0.1:8000/strategy/report/demo-techforge?force=true"),
        fetch("http://127.0.0.1:8000/strategy/posting/demo-techforge?force=true")
    )

asyncio.run(main())
