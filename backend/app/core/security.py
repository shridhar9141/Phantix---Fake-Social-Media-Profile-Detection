from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.firebase import verify_firebase_id_token

security_scheme = HTTPBearer(auto_error=False)

def verify_token_payload(token: str) -> Dict[str, Any]:
    """
    Verifies Firebase token using verify_firebase_id_token.
    """
    return verify_firebase_id_token(token)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    from app.models.user import User

    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        token_data = verify_token_payload(token)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authentication token: {str(err)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    firebase_uid = token_data["uid"]
    email = token_data.get("email", "user@identitytrace.io")
    display_name = token_data.get("name") or (email.split("@")[0] if email else "Analyst")

    # Find or create user in database
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        # Check by email to link existing records if any
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.firebase_uid = firebase_uid
        else:
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                display_name=display_name
            )
            db.add(user)
        db.commit()
        db.refresh(user)

    return user
