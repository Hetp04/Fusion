import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import * as Tone from 'tone';

interface Note {
  id: number;
  left: number;
  top: number;
  size: number;
  pitch: string;
}

const NUM_NOTES = 20;
const MIN_RADIUS = 20;
const MAX_RADIUS = 45;
const MIN_DISTANCE = 8;

const synth = new Tone.Synth().toDestination();

const PITCHES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

const QuarterNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const generateNotes = (): Note[] => {
      const newNotes: Note[] = [];

      for (let i = 0; i < NUM_NOTES; i++) {
        let candidate: Note | null = null;
        let attempts = 0;

        while (!candidate && attempts < 20) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
          const left = 50 + radius * Math.cos(angle);
          const top = 50 + radius * Math.sin(angle);
          const size = 0.8 + Math.random() * 0.7;
          const pitch = PITCHES[Math.floor(Math.random() * PITCHES.length)];

          const newNote: Note = { id: i, left, top, size, pitch };

          const isValid = newNotes.every(note => {
            const dx = note.left - newNote.left;
            const dy = note.top - newNote.top;
            return Math.sqrt(dx * dx + dy * dy) >= MIN_DISTANCE;
          });

          if (isValid) candidate = newNote;
          attempts++;
        }

        if (candidate) {
          newNotes.push(candidate);
        } else {
          const angle = Math.random() * 2 * Math.PI;
          const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
          const left = 50 + radius * Math.cos(angle);
          const top = 50 + radius * Math.sin(angle);
          const size = 0.8 + Math.random() * 0.7;
          const pitch = PITCHES[Math.floor(Math.random() * PITCHES.length)];

          newNotes.push({ id: i, left, top, size, pitch});
        }
      }

      return newNotes;
    };

    setNotes(generateNotes());
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
      {notes.map(note => (
        <DraggableNote key={note.id} note={note} />
      ))}
    </div>
  );
};

export default QuarterNotes;

interface DraggableNoteProps {
  note: Note;
}

const DraggableNote: React.FC<DraggableNoteProps> = ({ note }) => {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleClick = async () => {
    await Tone.start(); // Ensure audio context is started
    synth.triggerAttackRelease(note.pitch, "8n");
  };

  const startFloat = () => {
    controls.start({
      x: [0, 20, 0, -20, 0],
      y: [0, -10, 0, 10, 0],
      transition: {
        duration: 10,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'mirror',
        delay: note.id * 0.2,
      },
    });
  };

  const returnToOrigin = async () => {
    await controls.start({
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 10 },
    });
    startFloat(); // Resume floating
  };

  useEffect(() => {
    startFloat();
  }, []);

  return (
    <div
      className="absolute"
      style={{
        left: `${note.left}%`,
        top: `${note.top}%`,
        pointerEvents: 'auto',
        zIndex: 10,
      }}
    >
      <motion.img
        src="/quarterNote.svg"
        alt="Quarter Note"
        className="cursor-grab active:cursor-grabbing"
        style={{
          x,
          y,
          scale: note.size,
          transform: 'translate(-50%, -50%)',
        }}
        animate={controls}
        drag
        dragMomentum={false}
        onDragStart={() => controls.stop()}
        onDragEnd={returnToOrigin}
        whileHover={{ scale: note.size * 1.2 }}
        whileDrag={{ scale: note.size * 1.3 }}
        onClick={handleClick}
      />
    </div>
  );
};