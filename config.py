class Config:
    SECRET_KEY = 'crs'
    MYSQL_HOST = 'localhost'
    MYSQL_PORT = 3307
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = ''
    MYSQL_DB = 'collegerecommendation'  # Use your actual DB name

def get_mysql_config():
    return {
        'host': Config.MYSQL_HOST,
        'port': Config.MYSQL_PORT,
        'user': Config.MYSQL_USER,
        'password': Config.MYSQL_PASSWORD,
        'database': Config.MYSQL_DB
    }
