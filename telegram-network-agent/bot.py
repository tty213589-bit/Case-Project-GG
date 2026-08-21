from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import yaml
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from agent import compose_reply, parse_complaint
from network import MikroTikReadOnly, Router, ruijie_status

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")


def ids(name: str) -> set[int]:
    return {int(x.strip()) for x in os.getenv(name, "").split(",") if x.strip()}


ALLOWED_CHATS = ids("ALLOWED_TELEGRAM_CHAT_IDS")
ALLOWED_USERS = ids("ALLOWED_TELEGRAM_USER_IDS")


def load_routers() -> list[Router]:
    routers_json = os.getenv("ROUTERS_JSON", "").strip()
    if routers_json:
        raw = json.loads(routers_json)
    else:
        raw = yaml.safe_load(Path(os.getenv("ROUTERS_FILE", "routers.yaml")).read_text())
    return [Router(**item) for item in raw.get("routers", [])]


ROUTERS = load_routers()


def authorized(update: Update) -> bool:
    chat_ok = not ALLOWED_CHATS or update.effective_chat.id in ALLOWED_CHATS
    user_ok = not ALLOWED_USERS or update.effective_user.id in ALLOWED_USERS
    return chat_ok and user_ok


def find_router(wifi: str) -> Router | None:
    value = wifi.casefold().strip()
    for router in ROUTERS:
        if any(value == name.casefold() for name in router.wifi_names):
            return router
    return None


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Send /check followed by the Wi-Fi name. I perform read-only MikroTik "
        "and Ruijie/Reyee checks. I cannot reboot or change settings."
    )


async def check_wifi(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not authorized(update):
        await update.message.reply_text("This network check is restricted to authorized staff.")
        return
    wifi = " ".join(context.args).strip()
    if not wifi:
        await update.message.reply_text("Please use: /check WiFi Name")
        return
    router = find_router(wifi)
    if not router:
        await update.message.reply_text("I cannot find that Wi-Fi name. Please check the spelling.")
        return
    await update.message.reply_text("Checking traffic and device status…")
    client = MikroTikReadOnly(router)
    try:
        traffic = await client.sample_traffic()
        cloud = await ruijie_status(router.ruijie_project_id)
        await update.message.reply_text(compose_reply(router.customer_name, wifi, traffic, cloud))
    except Exception as exc:
        logging.exception("Read-only check failed")
        await update.message.reply_text(f"I could not complete the check: {type(exc).__name__}.")
    finally:
        await client.close()


async def routers(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not authorized(update):
        return
    names = [", ".join(r.wifi_names) for r in ROUTERS]
    await update.message.reply_text("Configured Wi-Fi names:\n" + "\n".join(names))


async def natural_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not authorized(update) or not update.message or not update.message.text:
        return
    complaint = parse_complaint(update.message.text, [n for r in ROUTERS for n in r.wifi_names])
    if complaint.is_slow and complaint.wifi_name:
        context.args = complaint.wifi_name.split()
        await check_wifi(update, context)
    elif complaint.is_slow:
        await update.message.reply_text("Please tell me the Wi-Fi name so I can check it.")


def main():
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is missing")
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("check", check_wifi))
    app.add_handler(CommandHandler("routers", routers))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, natural_message))
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
