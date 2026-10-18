"""Minimal FastAPI service for SecondLook mobile confidence responses."""

import os

from fastapi import FastAPI, HTTPException

from .score_all_members import (
    DemoPaymentSelectionError,
    TransactionNotFoundError,
    get_michael_demo_confidence,
    get_transaction_confidence,
)


app = FastAPI(title="SecondLook Confidence API", version="1.0.0")


@app.get("/api/demo/michael")
def michael_demo_confidence() -> dict:
    """Return Michael's configured or latest scam-labeled wire payment result."""
    try:
        return get_michael_demo_confidence(
            configured_payment_id=os.getenv("SECONDLOOK_DEMO_PAYMENT_ID")
        )
    except (DemoPaymentSelectionError, TransactionNotFoundError) as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.get("/api/confidence/{member_id}/{payment_id}")
def transaction_confidence(member_id: str, payment_id: str) -> dict:
    """Return confidence, tier, and top positive factors for one payment."""
    try:
        return get_transaction_confidence(member_id, payment_id)
    except TransactionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
