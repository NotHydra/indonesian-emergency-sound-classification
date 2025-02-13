import os

import requests
from requests import Response

path: str = "wav/ambulans/split_49_ambulans full raw 1.wav"
# path: str = "wav/ambulans/split_207_ambulans full raw 1.wav"
# path: str = "wav/ambulans/split_469_ambulans full raw 1.wav"
# path: str = "wav/bukan-ambulans/split_54_bukan ambulans full raw 1.wav"
# path: str = "wav/bukan-ambulans/split_78_bukan ambulans full raw 1.wav"
# path: str = "wav/bukan-ambulans/split_567_bukan ambulans full raw 1.wav"

response: Response = requests.post(
    f"http://localhost:{int(os.getenv('PORT'))}/api/classify/",
    files={"file": open(path, "rb")},
)

print(response.json())
