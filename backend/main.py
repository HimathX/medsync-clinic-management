from core.database import test_database_connection, get_database_info

if __name__ == "__main__":
    ok = test_database_connection()
    if ok:
        info = get_database_info()
        print(info)
    else:
        print("Database test failed.")