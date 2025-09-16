import time, os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from web3 import Web3
from ipfs_client import upload_metadata
from web3_client import mint_sbt
from crypto_utils import sign_issue, verify_issue, is_expired, ORG_ADDR

app = FastAPI(title="VolunteerChain Issuer (Local, EIP-712)")

# --- Schemas ---
class IssueReq(BaseModel):
    student: str
    eventId: str
    role: str
    hours: int

class SignedMessage(BaseModel):
    student: str
    eventId: str
    role: str
    hours: int
    nonce: str          # 0x...
    expiresAt: int

class SignRes(BaseModel):
    signature: str
    message: SignedMessage

class IssueSignedReq(BaseModel):
    signature: str
    message: SignedMessage

class IssueRes(BaseModel):
    cid: str
    txHash: str

# --- Simple in-memory nonce store to prevent replay ---
USED_NONCES = set()

@app.get("/health")
def health():
    return {"ok": True, "rpc": os.getenv("RPC_URL"), "contract": os.getenv("CONTRACT_ADDRESS"), "organizer": ORG_ADDR}

# 1) Organizer tạo chữ ký (demo: server ký luôn). Thực tế có thể tách ra 1 tool CLI cho organizer.
@app.post("/sign", response_model=SignRes)
def api_sign(req: IssueReq):
    sig, msg = sign_issue(req.student, req.eventId, req.role, req.hours, ttl_seconds=600)
    return SignRes(signature=sig, message=msg)  # client nhận sig+msg để gửi /issue_signed

# 2) Client nộp chữ ký → server verify → upload metadata → mint
@app.post("/issue_signed", response_model=IssueRes)
def issue_signed(body: IssueSignedReq):
    # Anti-replay: check nonce chưa dùng và chưa hết hạn
    if body.message.nonce in USED_NONCES:
        raise HTTPException(status_code=400, detail="nonce already used")
    if is_expired(body.message.expiresAt):
        raise HTTPException(status_code=400, detail="signature expired")

    # Verify chữ ký: phải đúng ORG_ADDR
    rec = verify_issue(body.signature, body.message.dict())
    if rec != ORG_ADDR:
        raise HTTPException(status_code=401, detail=f"invalid signer: {rec}")

    # Build metadata (có thể thêm typedData & organizerSig để audit)
    metadata = {
        "name": f"SBT: {body.message.eventId}",
        "description": "Volunteer credential (non-transferable)",
        "attributes": [
            {"trait_type":"eventId","value":body.message.eventId},
            {"trait_type":"role","value":body.message.role},
            {"trait_type":"hours","value":int(body.message.hours)},
            {"trait_type":"issuedAt","value":int(time.time())},
        ],
        "organizer": ORG_ADDR,
        "organizerSig": body.signature,
        "typedMessage": body.message.dict(),
    }

    # Upload -> hash CID -> mint
    cid = upload_metadata(metadata)
    cid_hash = Web3.keccak(text=cid)

    try:
        tx_hash = mint_sbt(body.message.student, cid_hash)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"mint failed: {e}")

    # Mark nonce used
    USED_NONCES.add(body.message.nonce)
    return IssueRes(cid=cid, txHash=tx_hash)

