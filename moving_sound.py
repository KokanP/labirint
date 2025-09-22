import numpy as np
import wave
import os

def make_melody(filename, freqs, durations, sample_rate=44100, volume=0.4):
    full_wave = np.array([], dtype=np.float32)
    for f, d in zip(freqs, durations):
        t = np.linspace(0, d, int(sample_rate * d), endpoint=False)
        # retro square wave with exponential decay
        waveform = np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-10 * t)
        full_wave = np.concatenate((full_wave, waveform))
    # Scale to int16
    waveform_integers = np.int16(full_wave * volume * 32767)
    # Save
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(waveform_integers.tobytes())

os.makedirs("victory_sfx", exist_ok=True)

# Melody A: rising flourish
freqs_A = [262, 294, 330, 392, 523]  # C4 D4 E4 G4 C5
dur_A   = [0.1, 0.1, 0.1, 0.1, 0.25]
make_melody("victory_sfx/victory_A.wav", freqs_A, dur_A)

# Melody B: playful bounce
freqs_B = [330, 392, 523, 392, 330, 262]  # E4 G4 C5 G4 E4 C4
dur_B   = [0.12, 0.12, 0.16, 0.12, 0.12, 0.2]
make_melody("victory_sfx/victory_B.wav", freqs_B, dur_B)

print("Saved alternate celebratory victory melodies in 'victory_sfx/'")
