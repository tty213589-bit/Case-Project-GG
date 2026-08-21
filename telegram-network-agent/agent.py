from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class Complaint:
    wifi_name: str | None
    is_slow: bool


def parse_complaint(text: str, known_wifi_names: list[str]) -> Complaint:
    lower = text.casefold()
    matches = [name for name in known_wifi_names if name.casefold() in lower]
    wifi = max(matches, key=len) if matches else None
    if not wifi:
        match = re.search(r"(?:wifi|wi-fi|ssid)\s*(?:name)?\s*[:=-]?\s*([^,\n]+)", text, re.I)
        wifi = match.group(1).strip() if match else None
    slow_words = ("slow", "lag", "no internet", "អ៊ីនធឺណិតយឺត", "យឺត")
    return Complaint(wifi_name=wifi, is_slow=any(word in lower for word in slow_words))


def compose_reply(customer: str, wifi: str, traffic: dict, ruijie: dict | None) -> str:
    rx = traffic.get("rx_mbps", 0.0)
    tx = traffic.get("tx_mbps", 0.0)
    down = traffic.get("plan_download_mbps", 0.0)
    utilization = (rx / down * 100) if down else 0
    if utilization >= 80:
        finding = "The connection is currently using a high amount of its download limit."
    elif utilization >= 40:
        finding = "The connection is moderately busy right now."
    else:
        finding = "Traffic is normal right now."
    device = ""
    if ruijie:
        device = f"\nRuijie/Reyee: {ruijie.get('summary', 'status received')}"
    return (
        f"Internet check for {customer} ({wifi})\n"
        f"Download: {rx:.2f} Mbps / Upload: {tx:.2f} Mbps\n"
        f"{finding}{device}\n\n"
        "This was a read-only check. No router settings were changed."
    )
