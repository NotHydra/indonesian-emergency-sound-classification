from io import BufferedReader
from fastapi import Response

import requests

url: str = "http://localhost:3001/api/classify/"
files: dict[str, BufferedReader] = {"file": open("test.wav", "rb")}
response: Response = requests.post(url, files=files)

print(response.json())
