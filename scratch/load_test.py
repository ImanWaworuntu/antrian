import requests
import json
import time
import concurrent.futures
from datetime import datetime

# Firebase REST API Config
DB_URL = "https://antrian-smanet-default-rtdb.firebaseio.com"
DATE_KEY = datetime.now().strftime("%Y-%m-%d")

def register_user(i):
    url = f"{DB_URL}/queues/{DATE_KEY}.json"
    data = {
        "namaOrtu": f"Test Ortu {i}",
        "namaMurid": f"Test Murid {i}",
        "noTelp": f"081234567{i:03d}",
        "noUrut": i + 1000, # Offset to avoid conflict with previous test if any
        "status": "Menunggu",
        "timestamp": int(time.time() * 1000)
    }
    try:
        response = requests.post(url, json=data, timeout=5)
        if response.status_code != 200:
            return (False, response.status_code)
        return (True, 200)
    except Exception as e:
        return (False, str(e))

def run_load_test(count=100):
    print(f"--- LOAD TEST START ---")
    print(f"Target: {count} users")
    
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(register_user, range(1, count + 1)))
    
    end_time = time.time()
    duration = end_time - start_time
    
    success_count = len([r for r in results if r[0]])
    errors = {}
    for r in results:
        if not r[0]:
            err = str(r[1])
            errors[err] = errors.get(err, 0) + 1
            
    print(f"--- LOAD TEST FINISHED ---")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Success: {success_count}")
    print(f"Errors: {errors}")

if __name__ == "__main__":
    run_load_test(100)
