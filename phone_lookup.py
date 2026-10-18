"""Facts and risk signals for SecondScan's phone number scan.

Offline facts come from Google's libphonenumber (the `phonenumbers` package):
whether the number is valid, its country and area, its number type, and the
original carrier where the numbering plan records one. US numbers keep their
number when they switch carrier and the numbering plan can't tell a mobile from
an internet (VoIP) number, so the live line type (which is how VoIP apps such as
Google Voice and TextNow show up), current carrier and registered caller ID name
come from Twilio Lookup v2. That lookup is optional: it runs only when
TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set.
"""

import os
import re
from urllib.parse import quote

import phonenumbers
import requests
from phonenumbers import PhoneNumberFormat, PhoneNumberType, carrier, geocoder

DEFAULT_REGION = "US"

NUMBER_TYPE_LABELS = {
    PhoneNumberType.FIXED_LINE: "Landline",
    PhoneNumberType.MOBILE: "Mobile",
    PhoneNumberType.FIXED_LINE_OR_MOBILE: "Landline or mobile",
    PhoneNumberType.TOLL_FREE: "Toll-free",
    PhoneNumberType.PREMIUM_RATE: "Premium-rate",
    PhoneNumberType.SHARED_COST: "Shared-cost",
    PhoneNumberType.VOIP: "Internet (VoIP) number",
    PhoneNumberType.PERSONAL_NUMBER: "Personal number",
    PhoneNumberType.PAGER: "Pager",
    PhoneNumberType.UAN: "Universal access number",
    PhoneNumberType.VOICEMAIL: "Voicemail",
}

# Twilio Lookup v2 line_type_intelligence.type values.
TWILIO_LINE_TYPES = {
    "landline": "Landline",
    "mobile": "Mobile",
    "fixedVoip": "Internet (VoIP) line tied to an address",
    "nonFixedVoip": "Virtual internet (VoIP) number",
    "personal": "Personal number",
    "tollFree": "Toll-free",
    "premium": "Premium-rate",
    "sharedCost": "Shared-cost",
    "uan": "Universal access number",
    "voicemail": "Voicemail",
    "pager": "Pager",
}

# Words in a carrier name that identify the app behind a virtual number.
VOIP_APPS = [
    ("google", "Google Voice"),
    ("enflick", "TextNow"),
    ("textnow", "TextNow"),
    ("pinger", "Pinger (Textfree, Sideline)"),
    ("twilio", "Twilio, which rents numbers to businesses and apps"),
]

# +1 numbers that are part of the US (states and territories) or Canada. Every
# other +1 region is a separate country, mostly in the Caribbean, whose numbers
# look domestic - the trick behind "one-ring" callback scams.
US_AND_CANADA = {"US", "CA", "PR", "VI", "GU", "AS", "MP", "UM"}


class PhoneParseError(ValueError):
    pass


def parse_number(raw: str) -> phonenumbers.PhoneNumber:
    if not re.search(r"\d", raw or ""):
        raise PhoneParseError("Enter a phone number to scan.")
    try:
        num = phonenumbers.parse(raw, DEFAULT_REGION)
    except phonenumbers.NumberParseException:
        raise PhoneParseError(
            "That doesn't look like a phone number. For numbers outside the US, start with + and the country code."
        )
    reason = phonenumbers.is_possible_number_with_reason(num)
    if reason == phonenumbers.ValidationResult.INVALID_COUNTRY_CODE:
        raise PhoneParseError("That country code doesn't exist. Check the digits after the +.")
    if reason == phonenumbers.ValidationResult.TOO_SHORT:
        raise PhoneParseError(
            "That's too short to be a full phone number. If a text came from a short code (like 32665), "
            "scan the message itself with Paste text instead."
        )
    if reason in (phonenumbers.ValidationResult.TOO_LONG, phonenumbers.ValidationResult.INVALID_LENGTH):
        raise PhoneParseError("That number has the wrong number of digits for its country. Check you typed all of it.")
    return num


def offline_facts(num: phonenumbers.PhoneNumber) -> dict:
    region = phonenumbers.region_code_for_number(num)
    nsn = phonenumbers.national_significant_number(num)
    country = geocoder.country_name_for_number(num, "en") or None
    location = geocoder.description_for_number(num, "en") or None
    return {
        "e164": phonenumbers.format_number(num, PhoneNumberFormat.E164),
        "display": phonenumbers.format_number(
            num, PhoneNumberFormat.NATIONAL if region == "US" else PhoneNumberFormat.INTERNATIONAL
        ),
        "possible": phonenumbers.is_possible_number(num),
        "valid": phonenumbers.is_valid_number(num),
        "region_code": region,
        "country": country,
        "location": location if location != country else None,
        "number_type": NUMBER_TYPE_LABELS.get(phonenumbers.number_type(num)),
        "original_carrier": carrier.name_for_number(num, "en") or None,
        # 555-0100 to 555-0199 is reserved for films and TV in every +1 area code.
        "fictional": num.country_code == 1 and nsn[3:6] == "555" and 100 <= int(nsn[6:] or 0) <= 199,
        "overseas_plus_one": num.country_code == 1 and region is not None and region not in US_AND_CANADA,
        "repeated_digits": bool(re.search(r"(\d)\1{5,}", nsn)),
    }


def carrier_lookup(e164: str, region_code: str | None) -> dict | None:
    """Live line type, carrier and (US only) caller ID name from Twilio Lookup v2.
    Returns None when Twilio isn't configured; raises requests errors on failure."""
    sid = os.environ.get("TWILIO_ACCOUNT_SID", "")
    token = os.environ.get("TWILIO_AUTH_TOKEN", "")
    if not (sid and token):
        return None
    fields = "line_type_intelligence,caller_name" if region_code == "US" else "line_type_intelligence"
    r = requests.get(
        f"https://lookups.twilio.com/v2/PhoneNumbers/{quote(e164)}",
        params={"Fields": fields},
        auth=(sid, token),
        timeout=8,
    )
    r.raise_for_status()
    data = r.json()
    line = data.get("line_type_intelligence") or {}
    caller = data.get("caller_name") or {}
    return {
        "live_valid": data.get("valid"),
        "live_line_type_code": line.get("type"),
        "live_line_type": TWILIO_LINE_TYPES.get(line.get("type")),
        "live_carrier": line.get("carrier_name"),
        "caller_name": caller.get("caller_name"),
        "caller_type": caller.get("caller_type"),  # "CONSUMER", "BUSINESS" or None
    }


def look_up(raw: str) -> dict:
    facts = offline_facts(parse_number(raw))
    facts["live_lookup"] = "off"
    if facts["possible"]:
        try:
            live = carrier_lookup(facts["e164"], facts["region_code"])
            if live is not None:
                facts.update(live)
                facts["live_lookup"] = "done"
        except requests.RequestException as e:
            # A failed carrier lookup still leaves the offline facts to scan with.
            print(f"Twilio lookup failed: {e}")
            facts["live_lookup"] = "failed"

    live_type = facts.get("live_line_type_code")
    facts["is_voip"] = live_type == "nonFixedVoip" or (
        live_type is None and facts["number_type"] == NUMBER_TYPE_LABELS[PhoneNumberType.VOIP]
    )
    carrier_name = (facts.get("live_carrier") or "").lower()
    facts["voip_app"] = next((app for key, app in VOIP_APPS if key in carrier_name), None) if facts["is_voip"] else None
    return facts


def detect_phone_signals(facts: dict) -> list[dict]:
    """Rule-based red flags about the number itself, each with a severity."""
    signals = []

    def flag(label: str, severity: str):
        signals.append({"label": label, "severity": severity})

    if not facts["possible"]:
        flag("Wrong length for a phone number in this country", "high")
    elif not facts["valid"] or facts.get("live_valid") is False:
        flag("Not a valid, assigned phone number", "high")
    if facts["fictional"]:
        flag("555-01XX number reserved for films and TV, not a real line", "high")
    if facts["number_type"] == "Premium-rate" or facts.get("live_line_type_code") == "premium":
        flag("Premium-rate number: calling it back can cost a lot per minute", "high")
    if facts["overseas_plus_one"]:
        flag(
            f"Looks like a US number (+1) but is in {facts['country']}, a pattern used in one-ring callback scams",
            "medium",
        )
    if facts["is_voip"]:
        app = f" ({facts['voip_app']})" if facts["voip_app"] else ""
        flag(f"Virtual internet (VoIP) number{app}: free and quick to create or throw away", "medium")
    if facts["repeated_digits"]:
        flag("Unusual run of repeated digits", "low")
    return signals


def rule_verdict(phone_signals: list[dict], context_signals: list) -> str:
    """Verdict from the rule engine alone, used when the AI is unavailable."""
    if any(s["severity"] == "high" for s in phone_signals):
        return "danger"
    score = sum(2 if s["severity"] == "medium" else 1 for s in phone_signals) + len(context_signals)
    return "danger" if score >= 4 else "caution" if score >= 2 else "safe"


def display_facts(facts: dict) -> dict:
    """The facts the result card shows. Live lookup values win over the numbering plan."""
    return {
        "display": facts["display"],
        "e164": facts["e164"],
        "valid": facts["valid"] and facts.get("live_valid") is not False and not facts["fictional"],
        "country": facts["country"],
        "location": facts["location"],
        "line_type": facts.get("live_line_type") or facts["number_type"],
        "voip_app": facts["voip_app"],
        "carrier": facts.get("live_carrier") or facts["original_carrier"],
        "carrier_is_original": not facts.get("live_carrier") and bool(facts["original_carrier"]),
        "caller_name": facts.get("caller_name"),
        "caller_type": facts.get("caller_type"),
        "live_lookup": facts["live_lookup"],
        "owner_lookup": facts["region_code"] == "US" and facts["valid"],
    }
