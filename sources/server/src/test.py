from fastapi import Response

import requests

path: str = "wav/ambulans/split_49_ambulans full raw 1.wav"
# path: str = "wav/ambulans/split_207_ambulans full raw 1.wav"
# path: str = "wav/ambulans/split_469_ambulans full raw 1.wav"
# path: str = "wav/bukan-ambulans/split_54_bukan ambulans full raw 1.wav"
# path: str = "wav/bukan-ambulans/split_78_bukan ambulans full raw 1.wav"
# path: str = "wav/bukan-ambulans/split_567_bukan ambulans full raw 1.wav"

response: Response = requests.post(
    "http://localhost:3001/api/classify/", files={"file": open(path, "rb")}
)

print(response.json())
