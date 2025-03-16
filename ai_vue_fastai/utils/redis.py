import redis
from config.settings import settings

# 初始化 Redis 连接
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True,  # 自动解码为字符串
)

def set_code(key: str, value: str, expire: int = 60):
    redis_client.set(key, value, ex=expire)

def get_code(key: str) -> str:
    return redis_client.get(key)