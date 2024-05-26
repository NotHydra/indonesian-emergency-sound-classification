from pydub import AudioSegment 
  
audioFile = "./sources/sounds/traffic-noise/raw/(Done) y2mate.com - Suara lalu lintas kota  suasana jalan raya di sore hari  walking around.mp3"
outputFolder = "./sources/sounds/traffic-noise/test"
interval = 5000
startAt = 1

sound = AudioSegment.from_file(audioFile, format="mp3") 
for index, milisecond in enumerate(range(0, len(sound), interval), startAt):
    if (milisecond + interval) > len(sound):
        break

    sound[milisecond:(milisecond + interval)].export(f"{outputFolder}/{str(index)}.wav", format="wav")


  