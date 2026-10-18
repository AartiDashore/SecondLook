import re

SIGNAL_RULES = [
    ("urgency_language", "Urgency / pressure language",
     r"\b(act now|immediately|urgent(ly)?|right away|within (24|1|2|3|6|12)\s*(hours?|hrs?)|"
     r"account (will be|has been) (suspended|locked|blocked|closed)|final notice|last chance|"
     r"limited time|expires? (today|soon)|failure to (respond|comply))\b"),
    ("otp_pin_request", "Asks for OTP / PIN / CVV / password",
     r"\b(otp|one[- ]?time password|pin number|cvv|security code|verification code|"
     r"share your (pin|otp|password|code))\b"),
    ("payment_request", "Requests payment via gift card / crypto / wire",
     r"\b(gift card|itunes card|steam card|bitcoin|crypto(currency)?|wire transfer|western union|"
     r"pay(ment)? via|send money|google pay|paytm|upi id)\b"),
    ("bank_impersonation", "Claims to be a bank or official body",
     r"\b(bank|rbi|irs|income tax dept|customs|paypal|amazon (support|security)|microsoft support|"
     r"apple support|government)\b.{0,40}\b(verify|update|confirm|suspend|block|kyc)\b"),
    ("link_present", "Contains a link",
     r"https?://\S+|www\.\S+"),
    ("shortened_link", "Uses a shortened/obscured link",
     r"\b(bit\.ly|tinyurl|goo\.gl|t\.co|is\.gd|cutt\.ly|shorturl)\b"),
    ("install_request", "Pushes an app install or file download",
     r"\b(install (the |this )?app|download (the |this )?(app|file|apk)|\.apk\b|update your app now|"
     r"click here to update|open this file)\b"),
    ("prize_offer", "Unexpected prize / lottery / winner claim",
     r"\b(you('| ha)ve won|congratulations,? you|lottery|lucky draw|claim your (prize|reward)|selected as (a )?winner)\b"),
    ("job_offer_scam", "Suspiciously easy job/earning offer",
     r"\b(work from home.{0,20}(earn|make)|earn \$?\d+.{0,10}(per day|daily|a day)|part[- ]time job.{0,20}(easy|guaranteed))\b"),
    ("credential_request", "Asks to confirm/update account details",
     r"\b(confirm your (account|identity|details)|update your (account|payment|billing) (info|details|information)|"
     r"re-?verify your account|log ?in to (confirm|verify))\b"),
]

COMPILED = [(sid, label, re.compile(pattern, re.IGNORECASE)) for sid, label, pattern in SIGNAL_RULES]


def detect_signals(text: str):
    if not text:
        return []
    matched = []
    for sid, label, pattern in COMPILED:
        if pattern.search(text):
            matched.append({"id": sid, "label": label})
    return matched


LINK_PATTERN = re.compile(
    r"https?://\S+|www\.\S+|"
    r"\b(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|is\.gd|cutt\.ly|shorturl\.at|rebrand\.ly)/\S+|"
    r"\b[a-z0-9-]+\.(?:com|net|org|co|in|xyz|info|link|shop)\b(?:/\S*)?",
    re.IGNORECASE,
)


def contains_link(text: str) -> bool:
    return bool(LINK_PATTERN.search(text or ""))


def requests_install(text: str) -> bool:
    return bool(re.search(r"\.apk\b|install (the |this )?app|download (the |this )?(app|file)", text or "", re.IGNORECASE))
