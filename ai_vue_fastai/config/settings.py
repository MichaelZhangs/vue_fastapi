import os
from typing import Dict, Any

class Settings:
    # Redis 配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = None

    # MySQL 默认配置
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "123456"
    MYSQL_DB: str = "ai_db"

    # 多数据库配置
    DATABASES: Dict[str, Dict[str, Any]] = {
        "default": {
            "HOST": MYSQL_HOST,
            "PORT": MYSQL_PORT,
            "USER": MYSQL_USER,
            "PASSWORD": MYSQL_PASSWORD,
            "DB": MYSQL_DB,
        },
        "db1": {
            "HOST": "localhost",
            "PORT": 3306,
            "USER": "root",
            "PASSWORD": "123456",
            "DB": "bigdata",
        },
        "db2": {
            "HOST": "localhost",
            "PORT": 3306,
            "USER": "root",
            "PASSWORD": "123456",
            "DB": "heima",
        },
    }

    # JWT 配置
    SECRET_KEY: str = "abc12#@$%^&1"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    QRCODE_DIR: str = 'qrcode' # 二维码
    AVATAR_DIR: str = 'avatar' #头像

    server_host = "http://localhost:8000"

    # 日志配置
    LOG_DIR: str = "logs"
    LOG_FILE: str = os.path.join(LOG_DIR, "app.log")

    class Config:
        env_file = ".env"

# 实例化配置
settings = Settings()