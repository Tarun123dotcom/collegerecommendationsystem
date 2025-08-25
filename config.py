class Config:
    SECRET_KEY = 'crs'
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = ''
    MYSQL_DB = 'collegerecommendation'  # Use your actual DB name

def get_mysql_config():
    return {
        'host': Config.MYSQL_HOST,
        'user': Config.MYSQL_USER,
        'password': Config.MYSQL_PASSWORD,
        'database': Config.MYSQL_DB
    }
