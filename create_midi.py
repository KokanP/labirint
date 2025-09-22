# make_dark_fantasy.py
# Generates a 40-bar dark fantasy / ambient groove MIDI at 100 BPM
# Good for game use (background loop)
# Requires: mido (pip install mido)

from mido import Message, MidiFile, MidiTrack, MetaMessage, bpm2tempo
import random

out_path = "dark_fantasy.mid"
mid = MidiFile()
tpb = mid.ticks_per_beat  # default 480

# Meta track
meta = MidiTrack()
meta.append(MetaMessage('set_tempo', tempo=bpm2tempo(100), time=0))
meta.append(MetaMessage('time_signature', numerator=4, denominator=4, time=0))
mid.tracks.append(meta)

def beats_to_ticks(beats):
    return int(round(beats * tpb))

loop_beats = 40 * 4  # 40 bars of 4 beats

# ---------- DRUMS ----------
drums = MidiTrack()
drum_ch = 9
for bar in range(40):
    # tribal kick-like hit on beat 1
    drums.append(Message('note_on', channel=drum_ch, note=36, velocity=110, time=0))
    drums.append(Message('note_off', channel=drum_ch, note=36, velocity=0, time=beats_to_ticks(0.5)))
    # tom-like hit on beat 3
    drums.append(Message('note_on', channel=drum_ch, note=45, velocity=90, time=beats_to_ticks(2.0)))
    drums.append(Message('note_off', channel=drum_ch, note=45, velocity=0, time=beats_to_ticks(0.5)))
    # occasional accent hi-hat (beat 4, only sometimes)
    if bar % 4 == 0:
        drums.append(Message('note_on', channel=drum_ch, note=42, velocity=70, time=beats_to_ticks(1.0)))
        drums.append(Message('note_off', channel=drum_ch, note=42, velocity=0, time=beats_to_ticks(0.25)))
mid.tracks.append(drums)

# ---------- BASS ----------
bass = MidiTrack()
bass_ch = 0
bass.append(Message('program_change', channel=bass_ch, program=39, time=0))  # synth bass 2
bass_root = 43  # G2 (dark minor)
pattern = [0, 2, 3, 5]  # simple minor motif offsets
for bar in range(40):
    note = bass_root + random.choice(pattern)
    bass.append(Message('note_on', channel=bass_ch, note=note, velocity=95, time=0))
    bass.append(Message('note_off', channel=bass_ch, note=note, velocity=0, time=beats_to_ticks(2.0)))
    bass.append(Message('note_on', channel=bass_ch, note=note-12, velocity=80, time=0))
    bass.append(Message('note_off', channel=bass_ch, note=note-12, velocity=0, time=beats_to_ticks(2.0)))
mid.tracks.append(bass)

# ---------- PADS ----------
pad = MidiTrack()
pad_ch = 1
pad.append(Message('program_change', channel=pad_ch, program=90, time=0))  # pad 2 (warm)
chords = [
    [43, 55, 58],  # Gm
    [46, 58, 62],  # Bb
    [41, 53, 57],  # F
    [48, 60, 63],  # C
]
for bar in range(40):
    chord = chords[bar % 4]
    for i, n in enumerate(chord):
        pad.append(Message('note_on', channel=pad_ch, note=n, velocity=65, time=0 if i==0 else 0))
    pad.append(Message('note_off', channel=pad_ch, note=chord[0], velocity=0, time=beats_to_ticks(4)))
    for n in chord[1:]:
        pad.append(Message('note_off', channel=pad_ch, note=n, velocity=0, time=0))
mid.tracks.append(pad)

# ---------- LEAD (eerie flute-like motif that evolves) ----------
lead = MidiTrack()
lead_ch = 2
lead.append(Message('program_change', channel=lead_ch, program=73, time=0))  # flute
motifs = [
    [67, 70, 74],        # simple
    [67, 70, 74, 77],    # expansion
    [70, 74, 77, 79],    # rising
    [74, 77, 79, 82, 79] # climax
]
for bar in range(40):
    if bar < 8:
        notes = motifs[0]
        rhythm = [2.0, 2.0, 4.0]
    elif bar < 16:
        notes = motifs[1]
        rhythm = [1.0, 1.0, 2.0, 4.0]
    elif bar < 24:
        notes = motifs[2]
        rhythm = [1.0] * len(notes)
    elif bar < 32:
        notes = motifs[3]
        rhythm = [0.5] * len(notes)
    else:
        notes = motifs[1]
        rhythm = [2.0, 2.0, 4.0]

    for i, note in enumerate(notes):
        lead.append(Message('note_on', channel=lead_ch, note=note, velocity=85, time=0))
        lead.append(Message('note_off', channel=lead_ch, note=note, velocity=0, time=beats_to_ticks(rhythm[i % len(rhythm)])))
mid.tracks.append(lead)

# ---------- ARP (bells shimmer) ----------
arp = MidiTrack()
arp_ch = 3
arp.append(Message('program_change', channel=arp_ch, program=11, time=0))  # music box
arp_notes = [79, 82, 86, 91]  # high shimmer
sixteenth = 0.25
total_sixteenths = int(loop_beats / sixteenth)
for i in range(total_sixteenths):
    if random.random() < 0.3:  # not constant, airy
        note = random.choice(arp_notes)
        vel = random.choice([40, 60, 70])
        arp.append(Message('note_on', channel=arp_ch, note=note, velocity=vel, time=0))
        arp.append(Message('note_off', channel=arp_ch, note=note, velocity=0, time=beats_to_ticks(sixteenth)))
    else:
        arp.append(Message('note_off', channel=arp_ch, note=79, velocity=0, time=beats_to_ticks(sixteenth)))
mid.tracks.append(arp)

# Save
mid.save(out_path)
print(f"Saved evolving dark fantasy MIDI: {out_path}")
