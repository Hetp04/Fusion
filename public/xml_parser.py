import xml.etree.ElementTree as ET
import json

musicxml_file = 'public/twinkle.musicxml'  

# Parse the MusicXML data
tree = ET.parse(musicxml_file)
root = tree.getroot()

# Initialize a list to store the extracted note information
notes_info = []

# Iterate through each measure in the MusicXML file
for measure in root.findall('.//measure'):
    measure_number = measure.attrib.get('number')
    
    # Iterate through each note within the measure
    for note in measure.findall('.//note'):
        note_details = {}
        
        # Get pitch step and octave
        pitch = note.find('pitch')
        if pitch is not None:
            step = pitch.find('step').text if pitch.find('step') is not None else None
            octave = pitch.find('octave').text if pitch.find('octave') is not None else None
            pitch_info = {'step': step, 'octave': octave}
        else:
            pitch_info = None
        
        # Get duration and type of the note
        duration = note.find('duration').text if note.find('duration') is not None else None
        note_type = note.find('type').text if note.find('type') is not None else None
        
        # Append the extracted data
        note_details['measure_number'] = measure_number
        note_details['duration'] = duration
        note_details['type'] = note_type
        note_details['pitch'] = pitch_info
        
        # Add the note details to the list
        notes_info.append(note_details)

# Write the output to a JSON file
with open('notes_info.json', 'w') as json_file:
    json.dump(notes_info, json_file, indent=4)

print("Data successfully written to 'notes_info.json'")
