from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import bcrypt
import json
import random

from src.models import get_db, User, Conversation

import os

# Memory dictionary to mock sent emails for recovery 
reset_codes = {}

# REAL EMAIL CONFIGURATION (reads from .env)
conf_mail = ConnectionConfig(
    MAIL_USERNAME=os.environ.get("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD", ""),
    MAIL_FROM=os.environ.get("MAIL_FROM", ""),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)
fast_mail = FastMail(conf_mail)

# JWT configuration (reads from .env)
SECRET_KEY = os.environ.get("SECRET_KEY", "fallback_dev_key_change_this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days validity

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/api/auth", tags=["auth"])

def verify_password(plain_password: str, hashed_password: str):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

from fastapi import Header

async def get_user_or_session_id(
    authorization: str = Header(None),
    x_session_id: str = Header(None)
) -> str:
    """Extracts a private effective user ID to isolate documents and chats."""
    # 1. Try logged-in user from JWT
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_sub = payload.get("sub")
            if user_sub:
                return f"user_{user_sub}"
        except JWTError:
            pass
    # 2. Try anonymous session header
    if x_session_id:
        return f"guest_{x_session_id}"
    # 3. Fallback
    return "anonymous"

from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None

class ForgotPasswordBody(BaseModel):
    email: EmailStr

class ResetPasswordBody(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class GoogleLogin(BaseModel):
    token: str

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    new_user = User(
        email=user.email,
        name=user.name,
        hashed_password=get_password_hash(user.password),
        picture="https://ui-avatars.com/api/?name=" + user.name.replace(" ", "+")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": new_user.name, "email": new_user.email, "picture": new_user.picture}}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Correo o contraseña incorrectos")
        
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"name": user.name, "email": user.email, "picture": user.picture}}

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        # Prevent user-enumeration, always return ok
        return {"status": "ok", "message": "Si el correo está registrado, se envió un código temporal."}
    
    code = str(random.randint(100000, 999999))
    reset_codes[body.email] = code
    
    # Send actual email if configured, otherwise print to terminal
    if conf_mail.MAIL_USERNAME != "tu_correo@gmail.com":
        message = MessageSchema(
            subject="Recuperación de Contraseña - CareerAI",
            recipients=[body.email],
            body=f"Hola {user.name},\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nTu código de recuperación es: {code}\n\nSi no fuiste tú, ignora este mensaje.",
            subtype=MessageType.plain
        )
        try:
            await fast_mail.send_message(message)
            print(f"📧 Correo Real enviado exitosamente a {body.email}")
        except Exception as e:
            print(f"❌ Error enviando el correo real: {str(e)}")
    else:
        print("\n" + "="*50)
        print("📧 SIMULACIÓN (Debes configurar tu SMTP de Gmail en auth.py):")
        print(f"Para: {body.email}")
        print("Asunto: Recuperación de tu contraseña")
        print(f"Tu código de recuperación temporal es: {code}")
        print("="*50 + "\n")
    
    return {"status": "ok", "message": "Si el correo está registrado, se envió un código temporal."}

@router.post("/reset-password")
def reset_password(body: ResetPasswordBody, db: Session = Depends(get_db)):
    if reset_codes.get(body.email) != body.code:
        raise HTTPException(status_code=400, detail="Código inválido o ya ha expirado")
        
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Usuario no encontrado")
        
    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    
    reset_codes.pop(body.email, None)  # Invalidate token safely
    return {"status": "ok", "message": "Contraseña actualizada exitosamente"}

# Try to import Google Auth (if installed)
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False

@router.post("/google")
def google_login(google_data: GoogleLogin, db: Session = Depends(get_db)):
    if not GOOGLE_AUTH_AVAILABLE:
        raise HTTPException(status_code=500, detail="Google Auth is not installed properly")
        
    try:
        # Avoid verifying clientId to allow any client side requests for demo purposes
        # In production use ONLY your registered CLIENT_ID
        idinfo = id_token.verify_oauth2_token(
            google_data.token, 
            google_requests.Request()
        )
        
        email = idinfo['email']
        name = idinfo.get('name', 'Google User')
        picture = idinfo.get('picture', '')
        google_id = idinfo['sub']
        
        user = db.query(User).filter(or_(User.email == email, User.google_id == google_id)).first()
        
        if not user:
            # Create user automatically
            user = User(email=email, name=name, picture=picture, google_id=google_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update user info if needed
            if not user.google_id:
                user.google_id = google_id
            if picture:
                user.picture = picture
            db.commit()
            
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer", "user": {"name": user.name, "email": user.email, "picture": user.picture}}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Token de Google inválido")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"name": current_user.name, "email": current_user.email, "picture": current_user.picture}

@router.post("/me")
def update_me(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.picture is not None:
        current_user.picture = user_update.picture
        
    db.commit()
    db.refresh(current_user)
    return {"name": current_user.name, "email": current_user.email, "picture": current_user.picture}

# ================= Conversations Router Endpoints =================
conv_router = APIRouter(prefix="/api/conversations", tags=["conversations"])

class ConversationBody(BaseModel):
    id: str
    title: str
    messages: list

@conv_router.get("")
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()
    # Format according to frontend expectations
    return [{"id": c.id, "title": c.title, "messages": c.messages} for c in convs]

@conv_router.post("")
def save_conversation(data: ConversationBody, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == data.id).first()
    
    if conv:
        if conv.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        conv.title = data.title
        conv.messages = data.messages
        # updated_at will auto-update
    else:
        conv = Conversation(
            id=data.id,
            user_id=current_user.id,
            title=data.title,
            messages=data.messages
        )
        db.add(conv)
        
    db.commit()
    return {"status": "ok", "message": "Conversación guardada"}

@conv_router.delete("/{conv_id}")
def delete_conversation(conv_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Not found")
    if conv.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(conv)
    db.commit()
    return {"status": "ok", "message": "Conversación eliminada"}
