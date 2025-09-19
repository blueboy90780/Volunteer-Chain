import os, time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from web3 import Web3

from ipfs_client import upload_metadata
from web3_client import mint_sbt, organizer_address
from crypto_utils import sign_issue, verify_issue, is_expired, ORG_ADDR

app = FastAPI(title="VolunteerChain Issuer (Sepolia, EIP-712)")

# ---------- Schemas ----------
class IssueReq(BaseModel):
    student: str
    eventId: str
    role: str
    hours: int

class IssueRes(BaseModel):
    cid: str
    txHash: str

class SignedMessage(BaseModel):
    student: str
    eventId: str
    role: str
    hours: int
    nonce: str          # 0x-prefixed 32-byte hex
    expiresAt: int      # unix timestamp (seconds)

class IssueSignedReq(BaseModel):
    signature: str      # 0x-prefixed hex
    message: SignedMessage


# ---------- Health ----------
@app.get("/health")
def health():
    # TUYỆT ĐỐI không gọi network gì ở đây để tránh treo
    return {
        "ok": True,
        "rpc": os.getenv("RPC_URL"),
        "contract": os.getenv("CONTRACT_ADDRESS"),
        "organizer": ORG_ADDR,
    }


# ---------- Sign (organizer ký EIP-712) ----------
@app.post("/sign")
def sign(body: IssueReq):
    # TTL 20 phút
    ttl_seconds = 20 * 60
    now = int(time.time())
    expires = now + ttl_seconds

    # Tạo nonce 32 bytes (hex 0x...)
    nonce_bytes = os.urandom(32)
    nonce_hex = "0x" + nonce_bytes.hex()

    message = {
        "student": body.student,
        "eventId": body.eventId,
        "role": body.role,
        "hours": int(body.hours),
        "nonce": nonce_hex,
        "expiresAt": int(expires),
    }
    sig = sign_issue(message)     # trả về 0x...
    return {"signature": sig, "message": message}


# ---------- Issue DEMO (không chữ ký) ----------
@app.post("/issue", response_model=IssueRes)
def issue(body: IssueReq):
    # build metadata
    metadata = {
        "name": f"SBT: {body.eventId}",
        "description": "Volunteer credential (non-transferable)",
        "attributes": [
            {"trait_type": "eventId", "value": body.eventId},
            {"trait_type": "role", "value": body.role},
            {"trait_type": "hours", "value": int(body.hours)},
            {"trait_type": "issuedAt", "value": int(time.time())},
        ],
        "organizer": ORG_ADDR,
        "organizerSig": None,
        "typedMessage": None,
    }
    cid = upload_metadata(metadata)
    cid_hash = Web3.keccak(text=cid)

    # chuẩn bị tham số theo contract mới
    event_id_hash = Web3.keccak(text=body.eventId)
    # generate nonce ngẫu nhiên 32 bytes
    nonce32 = os.urandom(32)

    try:
        tx_hash = mint_sbt(
            body.student,
            cid_hash,
            nonce32,
            event_id_hash,
            int(body.hours),
            organizer_address()  # chính là ORG_ADDR
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint failed: {e}")

    return IssueRes(cid=cid, txHash=tx_hash)


# ---------- Issue SIGNED (verify + mint) ----------
@app.post("/issue_signed", response_model=IssueRes)
def issue_signed(body: IssueSignedReq):
    # 1) Kiểm tra hạn chữ ký
    if is_expired(body.message.expiresAt):
        raise HTTPException(status_code=400, detail="signature expired")

    # 2) Khôi phục signer và so với organizer đã cấu hình
    rec = verify_issue(body.signature, body.message.dict())
    if rec != ORG_ADDR:
        raise HTTPException(status_code=401, detail=f"invalid signer: {rec}")

    # 3) Upload metadata -> nhận CID
    metadata = {
        "name": f"SBT: {body.message.eventId}",
        "description": "Volunteer credential (non-transferable)",
        "attributes": [
            {"trait_type": "eventId", "value": body.message.eventId},
            {"trait_type": "role", "value": body.message.role},
            {"trait_type": "hours", "value": int(body.message.hours)},
            {"trait_type": "issuedAt", "value": int(time.time())},
        ],
        "organizer": ORG_ADDR,
        "organizerSig": body.signature,
        "typedMessage": body.message.dict(),
    }
    cid = upload_metadata(metadata)
    cid_hash = Web3.keccak(text=cid)

    # 4) Chuyển đổi tham số cho contract:
    #    - nonce: 0x -> bytes32
    if not body.message.nonce.startswith("0x"):
        raise HTTPException(status_code=400, detail="nonce must be 0x-prefixed hex")
    nonce_bytes = bytes.fromhex(body.message.nonce[2:])
    if len(nonce_bytes) != 32:
        raise HTTPException(status_code=400, detail="invalid nonce length (need 32 bytes)")

    #    - eventId: keccak(text)
    event_id_hash = Web3.keccak(text=body.message.eventId)

    # 5) Gọi contract mint
    try:
        tx_hash = mint_sbt(
            body.message.student,
            cid_hash,
            nonce_bytes,
            event_id_hash,
            int(body.message.hours),
            organizer_address()   # chính là ví signer đang chạy backend
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint failed: {e}")

    return IssueRes(cid=cid, txHash=tx_hash)
