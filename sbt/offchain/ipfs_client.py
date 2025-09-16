import os, json, hashlib, requests

PINATA_JWT = os.getenv("PINATA_JWT")  # nếu chưa có token thì để trống

def upload_json_mock(obj: dict) -> str:
    """
    Mock CID: hash SHA-256 nội dung JSON để demo.
    Khi có PINATA_JWT → dùng pinata thật bên dưới.
    """
    raw = json.dumps(obj, sort_keys=True).encode()
    h = hashlib.sha256(raw).hexdigest()
    return f"mockcid-{h}"

def upload_json_pinata(obj: dict) -> str:
    """Upload JSON lên Pinata, trả về CID chuẩn"""
    url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
    headers = {"Authorization": f"Bearer {PINATA_JWT}"}
    r = requests.post(url, headers=headers, json={"pinataContent": obj}, timeout=30)
    r.raise_for_status()
    return r.json()["IpfsHash"]

def upload_metadata(obj: dict) -> str:
    """Router: nếu có token → dùng pinata, không thì mock"""
    if PINATA_JWT:
        return upload_json_pinata(obj)
    return upload_json_mock(obj)
