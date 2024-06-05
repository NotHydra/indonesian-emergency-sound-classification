from pydub import AudioSegment 
  
audioFile = "./src/sounds/ambulance/raw/utomp3.com - - AMBULANCE DRIVER on duty menuju yogyakarta_v144P.mp3"
outputFolder = "./src/sounds/ambulance/test"

# audioFile = "./src/sounds/traffic-noise/raw/SUARA JALAN RAYA MALAM HARI.mp3"
# outputFolder = "./src/sounds/traffic-noise/test"

interval = 5000
startAt = 374

sound = AudioSegment.from_file(audioFile, format="mp3") 
for index, milisecond in enumerate(range(0, len(sound), interval), startAt):
    if (milisecond + interval) > len(sound):
        break

    sound[milisecond:(milisecond + interval)].export(f"{outputFolder}/{str(index)}.wav", format="wav")

    print(f"Exported {outputFolder}/{str(index)}.wav")
