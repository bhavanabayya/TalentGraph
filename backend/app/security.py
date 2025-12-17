import os
import jwt
from fastapi import Header, HTTPException

JWT_SECRET = os.getenv("APP_JWT_SECRET", "dev-secret")

def require_token(authorization: str = Header(default="")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.replace("Bearer ", "").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]  # email
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid/expired token")
