import { useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';
import Keyboard from '../Keyboard.tsx';
import Dash from '../Dash.tsx';

const App = () => {
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [noteTimerStart, setNoteTimerStart] = useState(null);
  const [heldNotes, setHeldNotes] = useState([]);
  const [octave, setOctave] = useState(4);

  const keyToNoteMap = {
    'a': `C${octave}`,
    'w': `C#${octave}`,
    's': `D${octave}`,
    'e': `D#${octave}`,
    'd': `E${octave}`,
    'f': `F${octave}`,
    't': `F#${octave}`,
    'g': `G${octave}`,
    'y': `G#${octave}`,
    'h': `A${octave}`,
    'u': `A#${octave}`,
    'j': `B${octave}`,
    'k': `C${octave + 1}`,
  };

  const metronome = new Tone.MembraneSynth().toDestination();
  const transport = Tone.Transport;
  transport.bpm.value = tempo;

  const activeSynths = useRef({});
  const pressStartTimes = useRef({});

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const note = keyToNoteMap[key];

      if (note && !activeSynths.current[key]) {
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttack(note);
        activeSynths.current[key] = synth;
        pressStartTimes.current[key] = Date.now();
        setHeldNotes((prev) => [...prev, note]);

        if (noteTimerStart === null) {
          setNoteTimerStart(Date.now());
        }
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      const note = keyToNoteMap[key];
      const synth = activeSynths.current[key];

      if (note && synth) {
        const start = pressStartTimes.current[key];
        if (start) {
          const duration = Date.now() - start;
          console.log(`Pressed '${key}' for ${duration} milliseconds`);
          delete pressStartTimes.current[key];
        }

        synth.triggerRelease();
        delete activeSynths.current[key];

        setHeldNotes((prev) => prev.filter((n) => n !== note));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [noteTimerStart, octave]);

  const toggleMetronome = () => {
    if (isMetronomeActive) {
      transport.stop();
      setIsMetronomeActive(false);
    } else {
      transport.start();
      setIsMetronomeActive(true);
    }
  };

  const handleTempoChange = (event) => {
    setTempo(event.target.value);
    transport.bpm.value = event.target.value;
  };

  useEffect(() => {
    transport.scheduleRepeat((time) => {
      metronome.triggerAttackRelease('C2', '8n');
    }, '4n');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <Dash />
      <Keyboard octave={octave} setOctave={setOctave} /> {/* Pass octave and setOctave as props */}

      <h1>Press keys to play notes</h1>
      <p>
        {heldNotes.length > 0
          ? `Currently playing: ${heldNotes.join(', ')}`
          : 'Press and hold a key to play a note'}
      </p>
      <p>Use the following keys to play:</p>
      <ul>
        <li>A = C{octave}</li>
        <li>S = D{octave}</li>
        <li>D = E{octave}</li>
        <li>F = F{octave}</li>
        <li>G = G{octave}</li>
        <li>H = A{octave}</li>
        <li>J = B{octave}</li>
        <li>K = C{octave + 1}</li>
      </ul>

      <pre>
        {`
  Key:  a  a  g  g  h  h  g
  Notes: C${octave} C${octave} G${octave} G${octave} A${octave} A${octave} G${octave}
  Lyrics: Twinkle, twinkle, little star

  Key:  f  f  d  d  s  s  a
  Notes: F${octave} F${octave} E${octave} E${octave} D${octave} D${octave} C${octave}
  Lyrics: How I wonder what you are
        `}
      </pre>

      <div>
        <button
          onClick={toggleMetronome}
          style={{
            backgroundColor: isMetronomeActive ? '#ff6347' : '#32cd32',
            color: 'white',
            padding: '10px 20px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
          }}
        >
          {isMetronomeActive ? 'Stop Metronome' : 'Start Metronome'}
        </button>
      </div>

      <div>
        <label htmlFor="tempo">Set Tempo (BPM):</label>
        <input
          id="tempo"
          type="number"
          value={tempo}
          onChange={handleTempoChange}
          min="60"
          max="200"
        />
      </div>
    </div>
  );
};

export default App;
