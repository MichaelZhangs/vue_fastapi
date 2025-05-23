# models/__init__.py

from pydantic import BaseModel

class User(BaseModel):
    username: str
    password: str

class UserInDB(User):
    id: int