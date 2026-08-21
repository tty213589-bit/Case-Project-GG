from __future__ import annotations
import asyncio, os, time
from dataclasses import dataclass
import httpx

@dataclass
class Router:
    wifi_names: list[str]
    customer_name: str
    host: str
    port: int
    username: str
    password_env: str
    verify_tls: bool
    wan_interface: str
    plan_download_mbps: float
    plan_upload_mbps: float
    ruijie_project_id: str | None = None

class MikroTikReadOnly:
    def __init__(self, router: Router):
        self.router = router
        password = os.getenv(router.password_env)
        if not password:
            raise RuntimeError(f"Missing environment variable: {router.password_env}")
        self.client = httpx.AsyncClient(base_url=f"https://{router.host}:{router.port}/rest", auth=(router.username, password), verify=router.verify_tls, timeout=12)
    async def _read_counter(self):
        response = await self.client.get("/interface", params={".proplist":"name,rx-byte,tx-byte"})
        response.raise_for_status()
        for item in response.json():
            if item.get("name") == self.router.wan_interface:
                return int(item.get("rx-byte",0)), int(item.get("tx-byte",0))
        raise RuntimeError(f"Interface {self.router.wan_interface!r} not found")
    async def sample_traffic(self, seconds: float = 2.0):
        rx1, tx1 = await self._read_counter(); started = time.monotonic(); await asyncio.sleep(seconds); rx2, tx2 = await self._read_counter(); elapsed=max(time.monotonic()-started,0.1)
        return {"rx_mbps":max(0,rx2-rx1)*8/elapsed/1_000_000,"tx_mbps":max(0,tx2-tx1)*8/elapsed/1_000_000,"plan_download_mbps":self.router.plan_download_mbps,"plan_upload_mbps":self.router.plan_upload_mbps}
    async def close(self):
        await self.client.aclose()

async def ruijie_status(project_id):
    base=os.getenv("RUIJIE_BASE_URL","").rstrip("/"); app_id=os.getenv("RUIJIE_APP_ID"); secret=os.getenv("RUIJIE_APP_SECRET")
    if not (base and app_id and secret and project_id): return None
    path=os.getenv("RUIJIE_STATUS_PATH","/api/status")
    async with httpx.AsyncClient(timeout=12) as client:
        response=await client.get(f"{base}{path}",params={"project_id":project_id},headers={"X-App-Id":app_id,"X-App-Secret":secret}); response.raise_for_status(); data=response.json(); return {"summary":data.get("summary") or data.get("status") or "online"}
