# crud.py
from sqlmodel import Session, select, and_, or_
from typing import List, Optional,Generator
from utils.mysql_model import User, UserCreate, UserUpdate
from utils.database import get_session,get_db_session
from contextlib import contextmanager

session = get_db_session()

class UserCRUD():
    def __init__(self, session: Session):
        self.session = session

    def create_user(self, user: UserCreate) -> User:
        db_user = User.from_orm(user)
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user

    def get_user_by_phone(self, phone: str) -> Optional[User]:
        statement = select(User).where(User.phone == phone)
        return self.session.exec(statement).first()

    def get_users(
            self,
            username: Optional[str] = None,
            phone: Optional[str] = None,
            sex: Optional[str] = None,
            skip: int = 0,
            limit: int = 100
    ) -> List[User]:
        statement = select(User)

        conditions = []
        if username:
            conditions.append(User.username.like(f"%{username}%"))
        if phone:
            conditions.append(User.phone.like(f"%{phone}%"))
        if sex:
            conditions.append(User.sex == sex)

        if conditions:
            statement = statement.where(and_(*conditions))

        statement = statement.offset(skip).limit(limit)
        return self.session.exec(statement).all()

    def count_users(
            self,
            username: Optional[str] = None,
            phone: Optional[str] = None,
            sex: Optional[str] = None
    ) -> int:
        statement = select(User)

        conditions = []
        if username:
            conditions.append(User.username.like(f"%{username}%"))
        if phone:
            conditions.append(User.phone.like(f"%{phone}%"))
        if sex:
            conditions.append(User.sex == sex)

        if conditions:
            statement = statement.where(and_(*conditions))

        return len(self.session.exec(statement).all())

    def update_user(self, phone: str, user_update: UserUpdate) -> Optional[User]:
        db_user = self.get_user_by_phone(phone)
        if not db_user:
            return None

        update_data = user_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_user, key, value)

        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user

    def update_user_field(self, phone: str, field: str, value: str) -> Optional[User]:
        db_user = self.get_user_by_phone(phone)
        if not db_user:
            return None

        setattr(db_user, field, value)
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user

    def get_user_by_username(self, username: str) -> Optional[User]:
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def user_exists(self, phone: str) -> bool:
        return self.get_user_by_phone(phone) is not None

    def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        with self.get_db() as session:
            db_user = session.get(User, user_id)
            if not db_user:
                return False

            session.delete(db_user)
            session.commit()
            return True