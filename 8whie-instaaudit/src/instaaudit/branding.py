"""
8WHIE InstaAudit Branding & Attribution Module
Centralized metadata and links for Aryan Thakur — 8WHIE
"""

BRAND = "8WHIE"
PROJECT = "InstaAudit"
FOUNDER = "Aryan Thakur"
CATEGORY = "Security Research & Development"
COPYRIGHT = "Copyright (c) 2026 Aryan Thakur — 8WHIE."

LINKS = {
    "instagram_brand": "https://www.instagram.com/8WHIE_/",
    "instagram_founder": "https://www.instagram.com/imarykt/",
    "telegram_channel": "https://t.me/whiee",
    "telegram_contact": "https://t.me/Iaaryan",
    "youtube": "https://www.youtube.com/@8WHIE",
    "github": "https://github.com/8WHIE",
}

DISCLAIMER = (
    "8WHIE InstaAudit is an independent defensive security research laboratory.\n"
    "It is NOT affiliated with, authorized, or endorsed by Instagram, Meta Platforms, "
    "or any external service. All testing runs against safe local synthetic targets."
)


def print_banner() -> None:
    banner = f"""
======================================================================
  ██████╗ ██╗    ██╗██╗  ██╗██╗███████╗   InstaAudit v1.0.0
 ██╔════╝ ██║    ██║██║  ██║██║██╔════╝   Defensive Authentication Lab
 ╚█████╗  ██║ █╗ ██║███████║██║█████╗     Brand: {BRAND}
  ╚═══██╗ ██║███╗██║██╔══██║██║██╔══╝     Founder: {FOUNDER}
 ██████╔╝ ╚███╔███╔╝██║  ██║██║███████╗   Category: {CATEGORY}
 ╚═════╝   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝╚══════╝
======================================================================
  {COPYRIGHT}
  GitHub:    {LINKS['github']}
  Telegram:  {LINKS['telegram_channel']} | Contact: {LINKS['telegram_contact']}
  Instagram: {LINKS['instagram_brand']} | Founder: {LINKS['instagram_founder']}
  YouTube:   {LINKS['youtube']}
======================================================================
"""
    print(banner)


def print_footer() -> None:
    footer = f"""
----------------------------------------------------------------------
[8WHIE InstaAudit] Research & Lab Framework | {COPYRIGHT}
Founder: {FOUNDER} | Links: {LINKS['github']} | {LINKS['telegram_channel']}
----------------------------------------------------------------------
"""
    print(footer)
