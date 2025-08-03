# main.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum
import base64
import os
from config.settings import settings
from utils.log import log_info, log_error
from utils.database import get_session
from utils.mysql_model import User, SexEnum, UserPublic, UserUpdate, UserInfo
from utils.mysql_crud import  UserCRUD
from sqlmodel import Session

router = APIRouter(tags=["用户信息"])


class PagedResponse(BaseModel):
    data: List[UserPublic]
    total: int
    page: int
    page_size: int


class SaveQrcodeRequest(BaseModel):
    phone: str
    qrcode: str

class SearchPhoneRequest(BaseModel):
    username: str  # 必填
    phone: str  # 必填
    email: Optional[str] = None  # 可选
    sex: Optional[SexEnum] = None  # 可选
    description: Optional[str] = None
    qrcode: Optional[str] = None
    photo: Optional[str] = None

class SaveAvatarRequest(BaseModel):
    phone: str
    photo: str

class UpdatePhoneRequest(BaseModel):
    new_phone: str
    verification_code: str

@router.get("/get-users", response_model=PagedResponse)
async def get_users(
        username: Optional[str] = Query(None),
        phone: Optional[str] = Query(None),
        sex: Optional[str] = Query(None),
        page: int = Query(1, ge=1),
        page_size: int = Query(10, ge=1, le=100),
        session: Session = Depends(get_session)
):
    try:
        crud = UserCRUD(session)

        # 获取总数
        total = crud.count_users(username, phone, sex)

        # 计算偏移量
        offset = (page - 1) * page_size

        # 获取分页数据
        users = crud.get_users(
            username=username,
            phone=phone,
            sex=sex,
            skip=offset,
            limit=page_size
        )

        return {
            "data": users,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    except Exception as e:
        log_error(f"获取用户列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取用户列表失败")


@router.get("/info", response_model=UserInfo)
async def get_user_info(
        phone: str = Query(regex=r"\d+"),
        session: Session = Depends(get_session)
):
    try:
        print(f"user : {phone}")
        crud = UserCRUD(session)
        user = crud.get_user_by_phone(phone)

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        return {
            "username": user.username ,
            "phone": user.phone,
            "email": user.email or '',
            "sex": user.sex or 'other',
            "description": user.description or '',
            "qrcode": user.qrcode or '',
            "photo": user.photo or ''
        }
    except Exception as e:
        log_error(f"获取用户信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail="获取用户信息失败")


@router.put("/info")
async def update_user_info(
        request: UserUpdate,
        session: Session = Depends(get_session)
):
    try:
        print(f"phone=: {request.phone}")

        if request.email == "":
            request.email = None

        crud = UserCRUD(session)

        updated_user = crud.update_user(request.phone,request)

        if not updated_user:
            raise HTTPException(status_code=404, detail="用户不存在")
        return {"message": "更新成功", "code": 200}
    except Exception as e:
        log_error(f"更新失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save-qrcode")
async def save_qrcode(
        request: SaveQrcodeRequest,
        session: Session = Depends(get_session)
):
    try:
        # 解码并保存图片
        image_data = base64.b64decode(request.qrcode.split(",")[1])
        os.makedirs(settings.QRCODE_DIR, exist_ok=True)
        file_name = f"qrcode_{request.phone}.png"
        file_path = os.path.join(settings.QRCODE_DIR, file_name)

        with open(file_path, "wb") as f:
            f.write(image_data)

        # 更新数据库
        qrcode_url = f"/{settings.QRCODE_DIR}/{file_name}"
        crud = UserCRUD(session)
        updated_user = crud.update_user_field(request.phone, "qrcode", qrcode_url)

        if not updated_user:
            raise HTTPException(status_code=404, detail="用户不存在")

        return {
            "message": "二维码保存成功",
            "file_path": file_path,
            "qrcode_url": qrcode_url
        }
    except Exception as e:
        log_error(f"二维码保存失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"二维码保存失败: {str(e)}")


@router.post("/upload-avatar")
async def upload_avatar(
        request: SaveAvatarRequest,
        session: Session = Depends(get_session)
):
    try:
        # 解码并保存图片
        image_data = base64.b64decode(request.photo.split(",")[1])
        os.makedirs(settings.AVATAR_DIR, exist_ok=True)
        filename = f"ph_{request.phone}.png"
        save_path = os.path.join(settings.AVATAR_DIR, filename)

        with open(save_path, "wb") as f:
            f.write(image_data)

        # 更新数据库
        avatar_url = f"/{settings.AVATAR_DIR}/{filename}"
        crud = UserCRUD(session)
        updated_user = crud.update_user_field(request.phone, "photo", avatar_url)

        if not updated_user:
            raise HTTPException(status_code=404, detail="用户不存在")

        return {
            "message": "头像上传成功",
            "file_path": save_path,
            "avatar_url": avatar_url
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        log_error(f"上传头像失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上传头像失败: {str(e)}")

# 其他路由保持不变...