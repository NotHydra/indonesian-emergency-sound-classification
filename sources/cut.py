from pydub import AudioSegment 
  
audioFile = "./sources/sounds/ambulance/raw/utomp3.com - GAWAT Apa Yang Terjadi Banyak Mobil Ambulance Melintas Sitinjau Lauik Hal Yang Ditakuti Terjadi.wav"
outputFolder = "./sources/sounds/ambulance/test"
interval = 5000
startAt = 314

sound = AudioSegment.from_file(audioFile, format="wav") 
for index, milisecond in enumerate(range(0, len(sound), interval), startAt):
    if (milisecond + interval) > len(sound):
        break

    sound[milisecond:milisecond + interval - 1].export(f"{outputFolder}/{str(index)}.wav", format="wav")


  