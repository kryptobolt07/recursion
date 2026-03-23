import asyncio
import logging
from app.services.public_analysis import PublicCompetitorAnalysisService

logging.basicConfig(level=logging.INFO)

async def main():
    service = PublicCompetitorAnalysisService()
    res = await service.discover("demo-techforge", force=True)
    print("Competitors found:", len(res["competitors"]))

if __name__ == "__main__":
    asyncio.run(main())
