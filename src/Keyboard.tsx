import React, { useEffect, useState } from 'react';
import { CSSProperties } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

interface KeyboardProps {
  octave: number;
  setOctave: React.Dispatch<React.SetStateAction<number>>;
}

const Keyboard: React.FC<KeyboardProps> = ({ octave, setOctave }) => {
  const [pressedKeys, setPressedKeys] = useState<{ [key: string]: boolean }>({});

  const white_key_width = 80;
  const white_key_height = 350;
  const white_key_spacing = 20;
  const white_key_fill = "white";
  const white_key_stroke = "black";
  const white_key_stroke_width = 5;
  const white_key_start_x = 125;
  const white_key_start_y = 50;

  const black_key_width = 40;
  const black_key_height = 170;
  const black_key_fill = "black";
  const black_key_stroke = "black";
  const black_key_stroke_width = 5;
  const black_key_start_x = 170;
  const black_key_start_y = 50;
  const black_key_xs = [352, 450, 592, 680, 768];

  const white_letter_gap_from_key_bottom = 150;
  const black_letter_gap_from_key_bottom = 67;

  const keyToNoteMap: { [key: string]: string } = {
    'a': `C${octave}`,
    's': `D${octave}`,
    'd': `E${octave}`,
    'f': `F${octave}`,
    'g': `G${octave}`,
    'h': `A${octave}`,
    'j': `B${octave}`,
    'k': `C${octave + 1}`,
    'w': `C#${octave}`,
    'e': `D#${octave}`,
    't': `F#${octave}`,
    'y': `G#${octave}`,
    'u': `A#${octave}`,
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (keyToNoteMap[key as string]) {
      setPressedKeys((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (keyToNoteMap[key as string]) {
      setPressedKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const changeOctave = (direction: number) => {
    setOctave((prevOctave: number) => {
      let newOctave = prevOctave + direction;
      if (newOctave < 1) return 1;
      if (newOctave > 7) return 7;
      return newOctave;
    });
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div style={styles.container}> 
      <div style={styles.octaveControls}>
        <button style={{ ...styles.octaveButton, backgroundColor: '#f3f4f6', color: '#222' }} onClick={() => changeOctave(-1)}>-</button>
        <span style={styles.octaveText}>Octave {octave}</span>
        <button style={{ ...styles.octaveButton, backgroundColor: '#f3f4f6', color: '#222' }} onClick={() => changeOctave(1)}>+</button>
      </div>


      <Stage width={900} height={450}>
        <Layer>
          {/* White keys */}
          {Array.from({ length: 8 }).map((_, index) => {
            const keyX = white_key_start_x + index * white_key_width;
            const keyLetter = Object.values(keyToNoteMap)[index];

            return (
              <React.Fragment key={`white-${index}`}>
                <Rect
                  x={keyX}
                  y={white_key_start_y}
                  width={white_key_width}
                  height={white_key_height}
                  fill={pressedKeys[Object.keys(keyToNoteMap)[index]] ? "lightgray" : white_key_fill}
                  stroke={white_key_stroke}
                  strokeWidth={white_key_stroke_width}
                />
                <Text
                  text={keyLetter}
                  x={keyX}
                  y={white_key_start_y + white_letter_gap_from_key_bottom}
                  width={white_key_width}
                  height={white_key_height}
                  align="center"
                  verticalAlign="middle"
                  fontSize={24}
                  fill="black"
                />
              </React.Fragment>
            );
          })}

          {/* Black keys */}
          {black_key_xs.map((x, index) => {
            const noteSharp = ["C#", "D#", "F#", "G#", "A#"][index];
            const keyLetter = ['w', 'e', 't', 'y', 'u'][index];

            return (
              <React.Fragment key={`black-${index}`}>
                <Rect
                  x={x-black_key_start_x}
                  y={black_key_start_y}
                  width={black_key_width}
                  height={black_key_height}
                  fill={pressedKeys[keyLetter] ? "#1e1e1e" : black_key_fill}
                  stroke={black_key_stroke}
                  strokeWidth={black_key_stroke_width}
                />
                <Text
                  text={noteSharp}
                  x={x-black_key_start_x}
                  y={black_key_start_y + black_letter_gap_from_key_bottom}
                  width={black_key_width}
                  height={black_key_height}
                  align="center"
                  verticalAlign="middle"
                  fontSize={20}
                  fill="white"
                />
              </React.Fragment>
            );
          })}

          {/* Black key legend */}
          {['w', 'e', 't', 'y', 'u'].map((key, index) => {
            const x = black_key_xs[index];
            return (
              <Text
                key={`legend-${key}`}
                text={key}
                x={x - black_key_width - 120}
                y={black_key_start_y - 35}
                fontSize={25}
                fill="black"
              />
            );
          })}

          {/* Key Labels */}
          {Object.keys(keyToNoteMap).map((key, index) => {
            if (['w', 'e', 't', 'y', 'u'].includes(key)) return null;

            const keyX = white_key_start_x + index * white_key_width;
            const isWhiteKey = index < 8;

            return (
              <Text
                key={`label-${key}`}
                text={key}
                x={keyX + white_key_width / 2 - 12} // Adjusting to center the key label
                y={white_key_start_y + white_key_height + 10}
                fontSize={25}
                fill="black"
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  octaveControls: {
    display: 'flex',
    marginLeft: '20px',
    alignItems: 'center',
    marginTop: '20px',
  },
  octaveButton: {
    backgroundColor: '#f3f4f6',
    border: 'none',
    color: '#222',
    fontSize: '18px',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    borderRadius: '50%',
    margin: '0 10px',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  octaveText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
};
export default Keyboard;

