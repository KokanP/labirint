import mido
import random

# --- Constants ---
FILENAME = 'retro_maze_music.mid'
TICKS_PER_BEAT = 480  # Standard resolution for MIDI files
TEMPO = 120 # Beats per minute
BPM_MICROSECONDS = mido.bpm2tempo(TEMPO)

# --- General MIDI Program Numbers (Retro Sounding) ---
# See https://en.wikipedia.org/wiki/General_MIDI for a full list
INSTRUMENTS = {
    'bass': 38,        # Synth Bass 1
    'arp_1': 80,       # Lead 1 (square)
    'arp_2': 99,       # Pad 6 (metallic)
    'melody': 81,      # Lead 2 (sawtooth)
    'counter_melody': 87, # Lead 8 (bass + lead)
    'pad': 88,         # Pad 1 (new age)
    'texture': 98,     # FX 3 (crystal)
}

# --- Music Theory ---
# C Minor scale notes
C_MINOR_SCALE = [60, 62, 63, 65, 67, 68, 70] # C, D, Eb, F, G, Ab, Bb

# A classic retro game chord progression in C minor: Cm - Ab - Eb - Bb (i - VI - III - VII)
CHORD_PROGRESSION = [
    # C Minor (Cm)
    {'bass': 36, 'arp': [60, 63, 67], 'pad': [60, 63, 67, 70]}, # C2 bass, C4-Eb4-G4 arp
    # A flat Major (Ab)
    {'bass': 44, 'arp': [56, 60, 63], 'pad': [56, 60, 63, 68]}, # Ab2 bass, Ab3-C4-Eb4 arp
    # E flat Major (Eb)
    {'bass': 39, 'arp': [63, 67, 70], 'pad': [63, 67, 70, 75]}, # Eb2 bass, Eb4-G4-Bb4 arp
    # B flat Major (Bb)
    {'bass': 46, 'arp': [58, 62, 65], 'pad': [58, 62, 65, 70]}, # Bb2 bass, Bb3-D4-F4 arp
]

# --- Helper Function to add a note to a track ---
def add_note(track, channel, note, velocity, start_time, duration):
    """Adds a note_on and note_off message to a track."""
    track.append(mido.Message('note_on', channel=channel, note=note, velocity=velocity, time=start_time))
    track.append(mido.Message('note_off', channel=channel, note=note, velocity=velocity, time=duration))

# --- Main Music Generation Function ---
def generate_music():
    # 1. Setup MIDI file and tracks
    mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
    
    # Create a track for each instrument + drums
    tracks = {name: mido.MidiTrack() for name in INSTRUMENTS}
    tracks['drums'] = mido.MidiTrack()
    
    # Set tempo on the first track (convention)
    tracks['bass'].append(mido.MetaMessage('set_tempo', tempo=BPM_MICROSECONDS))
    
    # 2. Assign instruments to channels
    channel_map = {name: i for i, name in enumerate(INSTRUMENTS)}
    for name, channel in channel_map.items():
        tracks[name].append(mido.Message('program_change', channel=channel, program=INSTRUMENTS[name]))
    
    DRUM_CHANNEL = 9 # MIDI standard for drums
    
    # --- Music Structure (64 bars total, approx. 2 mins at 120 BPM) ---
    # Each section is 8 bars long
    bar_duration = 4 * TICKS_PER_BEAT

    for bar in range(64):
        section = bar // 8 # Determines which section we are in
        chord = CHORD_PROGRESSION[(bar % 4)] # Cycle through chords every bar

        # --- Generate Parts for the current bar ---
        
        # ** DRUMS (Channel 9) **
        if section >= 0: # Drums start from the beginning
            tracks['drums'].append(mido.Message('note_on', channel=DRUM_CHANNEL, note=36, velocity=100, time=0)) # Kick drum
            tracks['drums'].append(mido.Message('note_off', channel=DRUM_CHANNEL, note=36, velocity=100, time=TICKS_PER_BEAT // 2))
            tracks['drums'].append(mido.Message('note_on', channel=DRUM_CHANNEL, note=38, velocity=90, time=TICKS_PER_BEAT // 2)) # Snare drum
            tracks['drums'].append(mido.Message('note_off', channel=DRUM_CHANNEL, note=38, velocity=90, time=TICKS_PER_BEAT))
            tracks['drums'].append(mido.Message('note_on', channel=DRUM_CHANNEL, note=36, velocity=100, time=0)) # Kick
            tracks['drums'].append(mido.Message('note_off', channel=DRUM_CHANNEL, note=36, velocity=100, time=TICKS_PER_BEAT // 2))
            tracks['drums'].append(mido.Message('note_on', channel=DRUM_CHANNEL, note=38, velocity=90, time=TICKS_PER_BEAT // 2)) # Snare
            tracks['drums'].append(mido.Message('note_off', channel=DRUM_CHANNEL, note=38, velocity=90, time=TICKS_PER_BEAT))
            
            for i in range(8): # Hi-hats
                 tracks['drums'].append(mido.Message('note_on', channel=DRUM_CHANNEL, note=42, velocity=70, time=0))
                 tracks['drums'].append(mido.Message('note_off', channel=DRUM_CHANNEL, note=42, velocity=70, time=TICKS_PER_BEAT // 2))


        # ** BASS (Channel 0) **
        if section >= 0: # Bass starts from the beginning
             add_note(tracks['bass'], channel_map['bass'], chord['bass'], 100, 0, bar_duration)
        else: # Add silence for alignment
             tracks['bass'].append(mido.Message('note_off', channel=channel_map['bass'], note=0, time=bar_duration))


        # ** PAD (Channel 5) **
        # MODIFIED: Correctly handles chords to prevent negative time values.
        if section >= 1: # Pads enter in the second section
            pad_duration = bar_duration - 4 # A small gap for silence
            # Turn all notes on at the start of the bar
            for i, note in enumerate(chord['pad']):
                # The first note_on has a delta of 0, subsequent are also 0 (simultaneous)
                tracks['pad'].append(mido.Message('note_on', channel=channel_map['pad'], note=note, velocity=60, time=0))

            # Turn all notes off after the duration
            for i, note in enumerate(chord['pad']):
                # The first note_off carries the time delay for the duration.
                # Subsequent note_offs are simultaneous (time=0).
                duration_delta = pad_duration if i == 0 else 0
                tracks['pad'].append(mido.Message('note_off', channel=channel_map['pad'], note=note, velocity=0, time=duration_delta))
            
            # Add a final rest to fill the bar
            rest_duration = bar_duration - pad_duration
            tracks['pad'].append(mido.Message('note_off', channel=channel_map['pad'], note=0, velocity=0, time=rest_duration))
        else:
             # If the section is not playing, add silence for the whole bar
             tracks['pad'].append(mido.Message('note_off', channel=channel_map['pad'], note=0, velocity=0, time=bar_duration))
        
        
        # ** ARPEGGIOS (Channel 1 & 2) **
        arp_notes = chord['arp']
        for i in range(16): # 16th notes
            note_time = TICKS_PER_BEAT // 4
            if section >= 2: # Arp 1 starts
                add_note(tracks['arp_1'], channel_map['arp_1'], arp_notes[i % len(arp_notes)], 80, 0, note_time)
            if section >= 4: # Arp 2 starts (higher octave)
                add_note(tracks['arp_2'], channel_map['arp_2'], arp_notes[i % len(arp_notes)] + 12, 70, 0, note_time)
        # Add silence if arps haven't started yet
        if section < 2: tracks['arp_1'].append(mido.Message('note_off', channel=channel_map['arp_1'], note=0, time=bar_duration))
        if section < 4: tracks['arp_2'].append(mido.Message('note_off', channel=channel_map['arp_2'], note=0, time=bar_duration))

        
        # ** TEXTURE (Channel 6) **
        if section >= 5 and bar % 2 == 0: # Enters later, plays every 2 bars
             add_note(tracks['texture'], channel_map['texture'], random.choice(C_MINOR_SCALE)+12, 50, 0, bar_duration * 2)
        else:
             tracks['texture'].append(mido.Message('note_off', channel=channel_map['texture'], note=0, time=bar_duration))

        
        # ** MELODY & COUNTER-MELODY (Channel 3 & 4) - Evolving part **
        melody_notes = []
        if section == 2 or section == 3: # Verse 1
             melody_notes = [C_MINOR_SCALE[0], C_MINOR_SCALE[1], C_MINOR_SCALE[2], -1] # Simple
        elif section == 4 or section == 5: # Chorus (evolved)
             melody_notes = [C_MINOR_SCALE[4], C_MINOR_SCALE[3], C_MINOR_SCALE[2], C_MINOR_SCALE[1]] # Higher, more active
        elif section >= 6: # Bridge/Outro (most complex)
             melody_notes = [C_MINOR_SCALE[0]+12, C_MINOR_SCALE[2], C_MINOR_SCALE[4], C_MINOR_SCALE[3]]

        if melody_notes:
            for i, note in enumerate(melody_notes):
                note_duration = TICKS_PER_BEAT
                if note != -1: # -1 signifies a rest
                    add_note(tracks['melody'], channel_map['melody'], note, 95, 0, note_duration)
                    # Counter-melody plays an echo in the last sections
                    if section >= 5:
                        add_note(tracks['counter_melody'], channel_map['counter_melody'], note - 12, 75, TICKS_PER_BEAT // 2, note_duration // 2)
                else:
                    tracks['melody'].append(mido.Message('note_off', channel=channel_map['melody'], note=0, time=note_duration))
        else: # Silence for melody and counter-melody
            tracks['melody'].append(mido.Message('note_off', channel=channel_map['melody'], note=0, time=bar_duration))
            tracks['counter_melody'].append(mido.Message('note_off', channel=channel_map['counter_melody'], note=0, time=bar_duration))

    # 3. Add all tracks to the MIDI file
    for track in tracks.values():
        mid.tracks.append(track)
        
    # 4. Save the file
    mid.save(FILENAME)
    print(f"Successfully generated '{FILENAME}'")


if __name__ == '__main__':
    generate_music()

