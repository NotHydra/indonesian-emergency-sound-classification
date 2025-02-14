import os

import requests
from requests import Response

path: str = "true.wav"

response: Response = requests.post(
    f"http://localhost:{int(os.getenv('PORT'))}/api/classify/",
    files={"file": open(path, "rb")},
)

print(response.json())
