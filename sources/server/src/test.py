from io import BufferedReader
from fastapi import Response

import requests

url: str = "http://localhost:3001/classify/"
files: dict[str, BufferedReader] = {"file": open("1.wav", "rb")}
response: Response = requests.post(url, files=files)

print(response.json())
