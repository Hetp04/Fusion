// utils/rhythm.ts

// 1. Returns a random array of durations that sum to 4 beats
export const generateRandomMeasure = (): number[] => {
    const durations = [1, 0.5]; // quarter and eighth notes
    const measure: number[] = [];
    let total = 0;
  
    while (total < 4) {
      const validDurations = durations.filter(d => d <= 4 - total);
      const choice = validDurations[Math.floor(Math.random() * validDurations.length)];
      measure.push(choice);
      total += choice;
    }
  
    return measure;
  };
  
  // 2. Converts a measure array into MusicXML string
  export const generateRandomMusicXML = (measure: number[]): string => {
    const divisions = 2; // quarter = 2, eighth = 1
    let noteXML = '';
  
    measure.forEach((duration) => {
      const type = duration === 1 ? 'quarter' : 'eighth';
      noteXML += `
        <note>
          <pitch>
            <step>C</step>
            <octave>4</octave>
          </pitch>
          <duration>${duration * divisions}</duration>
          <type>${type}</type>
        </note>
      `;
    });
  
    const musicXML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
  <score-partwise version="3.1">
    <part-list>
      <score-part id="P1">
        <part-name>Rhythm</part-name>
      </score-part>
    </part-list>
    <part id="P1">
      <measure number="1">
        <attributes>
          <divisions>${divisions}</divisions>
          <key><fifths>0</fifths></key>
          <time><beats>4</beats><beat-type>4</beat-type></time>
          <clef><sign>G</sign><line>2</line></clef>
        </attributes>
        ${noteXML}
      </measure>
    </part>
  </score-partwise>`;
  
    return musicXML;
  };