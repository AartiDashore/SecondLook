"""Minimal FastAPI service for SecondLook mobile confidence responses."""

from fastapi import FastAPI, HTTPException

from .score_all_members import TransactionNotFoundError, get_transaction_confidence


app = FastAPI(title="SecondLook Confidence API", version="1.0.0")


@app.get("/api/confidence/{member_id}/{payment_id}")
def transaction_confidence(member_id: str, payment_id: str) -> dict:
    """Return confidence, tier, and top positive factors for one payment."""
    try:
        return get_transaction_confidence(member_id, payment_id)
    except TransactionNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
