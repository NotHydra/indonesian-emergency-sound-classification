from pydub import AudioSegment 
  
sound = AudioSegment.from_file("./sources/sounds/traffic-noise/raw/y2mate.com - Suara lalu lintas kota  suasana jalan raya di sore hari  walking around.mp3", format="mp3") 
for index, milisecond in enumerate(range(0, len(sound), 5000), 1):
    if milisecond + 5000 > len(sound):
        break

    sound[milisecond:milisecond + 5000 - 1].export("./sources/sounds/traffic-noise/" + str(index) + ".wav", format="wav")


  