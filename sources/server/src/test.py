from io import BufferedReader
from fastapi import Response

import requests

path: str = "ambulance.wav"
# path: str = "traffic-noise.wav"
response: Response = requests.post("http://localhost:3001/api/classify/", files={"file": open(path, "rb")})

print(response.json())
