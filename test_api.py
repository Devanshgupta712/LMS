import requests

def test_api():
    print("Testing /api/auth/send-otp...")
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/auth/send-otp",
            json={"email": "s44522930@gmail.com"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
