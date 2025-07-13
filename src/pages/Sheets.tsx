import { useEffect, useRef, useState } from 'react';
import * as OpenSheetMusicDisplay from 'opensheetmusicdisplay';
import * as Tone from 'tone';
import Keyboard from '../Keyboard.tsx'; 
import { GoogleGenAI } from "@google/genai";
import { useNavigate } from 'react-router';

import amazing_grace from '../../note_data_jsons/amazing_grace.json';
import mary from '../../note_data_jsons/mary.json';
import twinkle from '../../note_data_jsons/twinkle.json';

import saints from '../../note_data_jsons/saints.json';
import spider from '../../note_data_jsons/spider.json';

import gemini from '../../public/gemini.png';
import JSZip from 'jszip';
import { motion } from 'framer-motion';

export function SheetMusicOSMD() {
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<string>(() => {
    return localStorage.getItem('selectedSheetMusic') || 'twinkle.musicxml';
  });
  const [musicXML, setMusicXML] = useState<string | null>(null);
  const osmdContainerRef = useRef<HTMLDivElement>(null);
  const osmdInstance = useRef<OpenSheetMusicDisplay.OpenSheetMusicDisplay | null>(null);
  const [song, setSong] = useState<string>(() => {
    return localStorage.getItem('selectedSong') || 'twinkle';
  });
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [isMetronomeActive2, setIsMetronomeActive2] = useState(false);

  const [tempo, setTempo] = useState(120); // Default tempo for metronome
  const [heldNotes, setHeldNotes] = useState<string[]>([]);
  const [octave, setOctave] = useState(4); // Default octave
  const [isCoachingActive, setIsCoachingActive] = useState(false)
  const [coachingStart, setCoachingStart] = useState(0)
  const coachingStartRef = useRef<number | null>(null);
  const startCoachingTimerRef = useRef(false);
  const iouListRef = useRef<any[]>([]);
  const noteHistoryRef = useRef<any[]>([]);
  const noteHistoryRefOld = useRef<any[]>([]);
  const [avgIou, setAvgIou] = useState(0.0);
  const [accuracy, setAccuracy] = useState(0.0);
  const [showMetrics, setShowMetrics] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(false); // Track song playback state
  const formattedNotesRef = useRef<any[]>([]);
  const formattedNotesRefOld = useRef<any[]>([]);
  const [numBeats, setNumBeats] = useState(0);
  const [text, setText] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chatOutputRef = useRef<string>("");
  const [uploadedMusicXML, setUploadedMusicXML] = useState<string | null>(null);
  const [uploadedSongName, setUploadedSongName] = useState<string | null>(null);
  const [uploadedSongData, setUploadedSongData] = useState<any[]>([]);

  // Sidebar state for chat and feedback
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMessages, setSidebarMessages] = useState<Array<{role: string, text: string}>>([
    { role: 'ai', text: 'Welcome! I will give you live feedback as you play. Ask me anything about your current song.' }
  ]);
  const [sidebarInput, setSidebarInput] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Recording functionality
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<Array<{note: string, startTime: number, duration: number}>>([]);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const recordingStartTime = useRef<number>(0);
  const [currentRecordingNotes, setCurrentRecordingNotes] = useState<string[]>([]);

  // Sidebar send handler (stub for now)
  const handleSidebarSend = () => {
    if (!sidebarInput.trim()) return;
    setSidebarMessages(msgs => [...msgs, { role: 'user', text: sidebarInput }]);
    setSidebarInput('');
    // TODO: Integrate with AI and push response
  };

  const ai = new GoogleGenAI({ apiKey: "AIzaSyB7gXVIWi9Zifw_UFk9wFAACjOWW-C84as" });

  const expectedValues = [
    { note: 'C4', duration: 500 }, 
    { note: 'C4', duration: 500 }, 
    { note: 'G4', duration: 500 }, 
    { note: 'G4', duration: 500 }, 
    { note: 'A4', duration: 500 }, 
    { note: 'A4', duration: 500 }, 
    { note: 'G4', duration: 1000 },
    { note: 'F4', duration: 500 }, 
    { note: 'F4', duration: 500 }, 
    { note: 'E4', duration: 500 }, 
    { note: 'E4', duration: 500 }, 
    { note: 'D4', duration: 500 }, 
    { note: 'D4', duration: 500 }, 
    { note: 'C4', duration: 1000 } 
  ];
  
  const actualValues = [
    { note: 'C4', duration: 500 },
    { note: 'C4', duration: 600 }, 
    { note: 'G4', duration: 500 },
    { note: 'G4', duration: 500 },
    { note: 'A4', duration: 500 },
    { note: 'A4', duration: 500 },
    { note: 'G4', duration: 1000 },
    { note: 'F4', duration: 500 },
    { note: 'F4', duration: 450 }, 
    { note: 'E4', duration: 500 },
    { note: 'E4', duration: 550 }, 
    { note: 'D4', duration: 500 }, 
    { note: 'D4', duration: 500 }, 
    { note: 'C4', duration: 1000 } 
  ];

  async function chatFeature() {
    setIsModalOpen(true);
    setText("Loading response...");
    
    // You can provide the data directly here
    const myData = `So I'm trying to play a piano piece on a virtual piano, and I've listed the expected values and my actual values, how can I improve? Here are the metrics. Please don't repeat the metrics just give nice feedback. Also compare with last run, which may be empty, don't mention it if it is. Don't do any formatting please. Be really nice like a piano instructor. Also if your previous advice is there, use it to inform you:
    Expected values: ${JSON.stringify(formattedNotesRef.current, null, 2)}
    Actual values: ${JSON.stringify(noteHistoryRef.current, null, 2)}
    Old Actual Values from last run: ${JSON.stringify(noteHistoryRefOld.current, null, 2)}
    Previous advice: ${chatOutputRef.current}
    `;

    console.log(myData);
  
    getResponse(myData); // Pass the data to the function
  }
  

  async function getResponse(data: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: data,  // pass data here
    });
  
    chatOutputRef.current = response.text || "";

    console.log(response.text);
    setText(response.text || ""); // set the response text to display in the modal
  }

  const keyToNoteMap = {
    a: `C${octave}`,
    w: `C#${octave}`,
    s: `D${octave}`,
    e: `D#${octave}`,
    d: `E${octave}`,
    f: `F${octave}`,
    t: `F#${octave}`,
    g: `G${octave}`,
    y: `G#${octave}`,
    h: `A${octave}`,
    u: `A#${octave}`,
    j: `B${octave}`,
    k: `C${octave + 1}`,
  };

  interface Note {
    note: string;
    duration: string;
    durationMs: string;
    time?: string; // Optional, if you want to add time calculations
  }

  let currentTime1 = 0;
  const millisecondsPerBeat1 = (60 / tempo) * 1000; // BPM to milliseconds per beat conversion
  console.log(`ms per beat: ${millisecondsPerBeat1}`)

  // Based on selected song, update the notes
  const songData: { [key: string]: any[] } = {
    mary: mary,
    twinkle: twinkle,
    saints: saints,
    spider: spider,
    amazing_grace: amazing_grace,
    uploaded: uploadedSongData
  };

  const notesToUse = songData[song] || mary;  // Default to mary if no song is found

  updateMusic();

  useEffect(() => {
    console.log("tempo changed");
    updateMusic();
  }, [tempo, uploadedSongData]);

  function updateMusic() {
    formattedNotesRef.current = []
    console.log("updating music")
    notesToUse.forEach((item: any) => {
      // Handle rest (pitch is null)
      if (item.pitch === null) {
          let duration = '';
          if (item.duration === "60") {
              duration = '8n'; // Eighth rest
          } else if (item.duration === "120") {
              duration = '4n'; // Quarter rest
          } else if (item.duration === "180") {
              duration = '4n.'; // Quarter half rest
          } else if (item.duration === "240") {
              duration = '2n'; // Half rest
          }
          
          const restDuration = duration === '8n' ? 1 / 8 :
                              duration === '4n' ? 1 / 4 :
                              duration === '2n' ? 1 / 2 : 1;
          
          const time = currentTime1;
          currentTime1 += restDuration * 4 * millisecondsPerBeat1;  // Update the time
          formattedNotesRef.current.push({ note: 'rest', duration, time: `${time}`, durationMs: `${restDuration * 4 * millisecondsPerBeat1}`});
      }else {
        // Handle regular notes
        const note = `${item.pitch.step}${item.pitch.octave}`;
        let duration = '';
        let noteDuration = 0;
    
        // Set the note duration based on item.type
        if (item.type === 'eighth') {
            duration = '8n';
            noteDuration = 1 / 8;
        } else if (item.type === 'quarter') {
            if (item.dot) { // Dotted quarter note
                duration = '4n.';
                noteDuration = (1 / 4) * 1.5; // 3/8
            } else {
                duration = '4n';
                noteDuration = 1 / 4;
            }
        } else if (item.type === 'half') {
            duration = '2n';
            noteDuration = 1 / 2;
        } else if (item.type === 'whole') {
            duration = '1n';
            noteDuration = 1;
        } else if (item.type === 'dotted-quarter') {
            duration = '4n.';
            noteDuration = (1 / 4) * 1.5; // 3/8
        } else if (item.type === 'dotted-half') {
          duration = '2n.';
          noteDuration = (1 / 2) * 1.5;
        }

        // Calculate time
        const time = currentTime1;
        currentTime1 += noteDuration * 4 * millisecondsPerBeat1;
    
        // Push to formattedNotes
        console.log(`ms per beat2: ${millisecondsPerBeat1}`)
        formattedNotesRef.current.push({ note, duration, time: `${time}`, durationMs: `${noteDuration * 4 * millisecondsPerBeat1}` });
      }

    });

    // console.log(`aboutta poop: ${JSON.stringify(formattedNotesRef.current)}`);
  }

  function calculateIou(start: number, end: number) {
    // console.log(`im pooping my pants rn: ${JSON.stringify(formattedNotesRef.current)}`);
    var true_note;
    var true_i = 0;
    for (let i = 0; i < formattedNotesRef.current.length; i++) {
      let note = formattedNotesRef.current[i];
      if (start < note.time) {
        true_note = formattedNotesRef.current[i-1];
        true_i = i-1
        break;
      }
    }

    var next_note;
    var next_i = formattedNotesRef.current.length - 1;
    for (let i = 0; i < formattedNotesRef.current.length; i++) {
      let note = formattedNotesRef.current[i];
      if (end < note.time) {
        next_note = formattedNotesRef.current[i-1];
        next_i = i-1
        break;
      }
    }

    let true_notes = [];
    for (let i = true_i; i <= next_i; i++) {
      true_notes.push(formattedNotesRef.current[i]);
    }

    let ious = [];
    let weights = [];
    for (let i = 0; i < true_notes.length; i++) {
      let true_note = true_notes[i];
      let true_start = true_note.time;
      console.log(`true note time: ${true_note.time}, duration: ${true_note.durationMs}`)
      let true_end = parseFloat(true_note.time) + parseFloat(true_note.durationMs);
      let intersection = 0;
      let union = 0;
      let weight = 0;

      console.log(`true start: ${true_start}, true_end: ${true_end}`)
      console.log(`start: ${start}, end: ${end}`)

      if ((start >= true_start) && (end <= true_end)) {
        intersection = end - start;
        union = true_end - true_start;
        weight = 1;
      } else if ((true_start <= start) && (end >= true_end)) {
        intersection = true_end - start;
        union = end - true_start;
        weight = (true_end - start) / (end - start);
      } else if ((true_start >= start) && (true_end <= end)) {
        intersection = true_end - true_start;
        union = end - start;
        weight = (true_end - true_start) / (end - start);
      } else if ((true_start >= start) && (true_end >= end)) {
        intersection = end - true_start;
        union = true_end - start;
        weight = (end - true_start) / (end - start);
      }
      ious.push(intersection / union);
      weights.push(weight);
    }

    let weighted_iou = 0;
    for (let i = 0; i < ious.length; i++) {
      weighted_iou += (ious[i] * weights[i])
    }

    return weighted_iou
    // New cases:
    // ###
    //  #
    //
    // ###
    //  ###
    // 
    //  #
    // ###
    //
    //  ###
    // ###

    // Old cases:
    // ###
    //  ###
    //
    // ####
    //  ##
    //
    //  ###
    // ###
    //
    //  ##
    // ####
  }

  function calculateAccuracy(noteHistory: any[]) {
    let count_correct = 0;
    let count_total = 0;
    let current_j = 0;
    for (let i = 0; i < noteHistory.length; i++) {
      let true_curr_note = formattedNotesRef.current[current_j].note;
      if (current_j < formattedNotesRef.current.length) {
        if (noteHistory[i].note[0] == true_curr_note[0]) {
          count_correct += 1;
          count_total += 1;
          current_j = current_j + 1;
        } else {
          count_total += 1;
        }
      } else {
        count_total += 1;
      }
    }

    return (count_correct / count_total);
  }
  
  // Calculate time for each note and include in the array
  let currentTime = 0;
  const millisecondsPerBeat = (60 / tempo) * 1000; // BPM to milliseconds per beat conversion

  // Function to play the song


  const playSong = async () => {
    setIsSongPlaying(true);
    // Ensure Tone.js is started
    await Tone.start();

    // Play the metronome for 4 beats
    const metronome = new Tone.MembraneSynth().toDestination();
    let beatCount = 0;
    let countIn = 0;
    let metronomeIntervalMs = Tone.Time('4n').toMilliseconds(); // default

    if (song === 'twinkle' || song === 'mary') {
      countIn = 4;
    }
    else if (song === 'saints' || song === 'amazing_grace') {
      countIn = 5;
    }
    else if (song === 'spider') {
      countIn = 11; // for 6/8 time
      metronomeIntervalMs = Tone.Time('8n').toMilliseconds(); // eighth-note metronome
    } else {
      countIn = 4; // or however many you want for 4/4 songs
      metronomeIntervalMs = Tone.Time('4n').toMilliseconds(); // quarter-note metronome
    }

    const metronomeInterval = setInterval(() => {
      metronome.triggerAttackRelease('C1', '8n');
      beatCount++;
      if (beatCount === countIn + 1) {
        if (!isMetronomeActive2) {
          clearInterval(metronomeInterval); // Stop the metronome after 4 beats
        }
        startSong();
      }

    }, metronomeIntervalMs);

    // Prevent starting the song until the metronome has clicked 4 times
    const startSong = async () => {
      // Create a synth to play the notes
      const synth = new Tone.Synth().toDestination();
      // Play the song
      for (let i = 0; i < formattedNotesRef.current.length; i++) {
        const { note, duration } = formattedNotesRef.current[i];
        console.log(duration);

        // Skip if the note is a rest
        if (note === 'rest') {
          // Do nothing, no need to trigger anything for rests
          await new Promise(resolve => setTimeout(resolve, Tone.Time(duration).toMilliseconds()));
        } else {
          synth.triggerAttackRelease(note, duration);
          await new Promise(resolve => setTimeout(resolve, Tone.Time(duration).toMilliseconds()));
        }
      }
      setIsSongPlaying(false); // Song finished or stopped
      clearInterval(metronomeInterval);
    };
  };

  const stopSong = () => {
    Tone.Transport.stop(); // Stop the transport to halt any ongoing playback
    if ('close' in Tone.context && typeof Tone.context.close === 'function') {
      (Tone.context.close as () => void)();
    }
    setIsSongPlaying(false);
    window.location.reload();
  };

  // Metronome setup
  const transport = Tone.Transport;
  transport.bpm.value = tempo;

  // Store synths and press start times per key
  const activeSynths = useRef<{ [key: string]: Tone.Synth }>({});
  const pressStartTimes = useRef<{ [key: string]: number }>({});

  const sheetMusicFiles = [
    { label: 'Twinkle, Twinkle, Little Star', file: 'twinkle.musicxml' },
    { label: 'When the Saints go Marching in', file: 'saints.musicxml' },
    { label: 'Mary Had a Little Lamb', file: 'mary.musicxml' },
    { label: 'Itsy Bitsy Spider', file: 'spider.musicxml' },
    { label: 'Amazing Grace', file: 'amazing_grace.musicxml' },
  ];

  // Handle selection change (dropdown)
  const handleFileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFile = event.target.value;
    setSelectedFile(event.target.value);
    localStorage.setItem('selectedSheetMusic', newFile);
    // console.log(newFile)

    // Update song name when file is selected
    const songName = newFile.split('.')[0] // Get the song name from the file name
      .replace('/', '') // Remove the leading slash
    setSong(songName);
    localStorage.setItem('selectedSong', songName);
  };

  // Add a handler for file upload
  const handleMusicXMLUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.name.endsWith('.mxl')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Try to find the main MusicXML file
        let xmlFile: JSZip.JSZipObject | null = null;
        let xmlFileName: string | null = null;

        // First try to find META-INF/container.xml to get the rootfile
        const containerPath = 'META-INF/container.xml';
        if (zip.file(containerPath)) {
          const containerXml = await zip.file(containerPath)!.async('text');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(containerXml, 'application/xml');
          const rootfile = xmlDoc.querySelector('rootfile');
          if (rootfile) {
            xmlFileName = rootfile.getAttribute('full-path');
            if (xmlFileName && zip.file(xmlFileName)) {
              xmlFile = zip.file(xmlFileName);
            }
          }
        }
        
        // Fallback: find the first .xml file if not found via container.xml
        if (!xmlFile) {
          zip.forEach((relativePath, zipEntry) => {
            if (!xmlFile && zipEntry.name.endsWith('.xml')) {
              xmlFile = zipEntry;
              xmlFileName = zipEntry.name;
            }
          });
        }
        
        if (xmlFile) {
          const xmlText = await xmlFile.async('text');
          setUploadedMusicXML(xmlText);
          setUploadedSongName(file.name.replace('.mxl', ''));
          setSelectedFile('uploaded');
          setSong('uploaded');
          setMusicXML(xmlText);
          
          // Generate simple note data for uploaded files
          const simpleNotes = generateSimpleNotes(xmlText);
          setUploadedSongData(simpleNotes);
        } else {
          alert('No .xml file found inside the .mxl archive.');
        }
      } catch (err) {
        alert('Error reading .mxl file: ' + (err instanceof Error ? err.message : String(err)));
      }
    } else {
      alert('Please upload a valid .mxl file.');
    }
  };

  // Function to generate simple note data from MusicXML
  const generateSimpleNotes = (xmlString: string): any[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      const notes: any[] = [];
      
      // Find all note elements
      const noteElements = xmlDoc.querySelectorAll('note');
      
      noteElements.forEach((noteElement) => {
        const restElement = noteElement.querySelector('rest');
        const pitchElement = noteElement.querySelector('pitch');
        const durationElement = noteElement.querySelector('duration');
        const typeElement = noteElement.querySelector('type');
        const dotElement = noteElement.querySelector('dot');
        
        if (restElement) {
          // This is a rest
          const duration = durationElement?.textContent || '120';
          const type = typeElement?.textContent || 'quarter';
          notes.push({
            pitch: null,
            duration: duration,
            type: type,
            dot: !!dotElement
          });
        } else if (pitchElement) {
          // This is a note
          const stepElement = pitchElement.querySelector('step');
          const octaveElement = pitchElement.querySelector('octave');
          const duration = durationElement?.textContent || '120';
          const type = typeElement?.textContent || 'quarter';
          
          if (stepElement && octaveElement) {
            notes.push({
              pitch: {
                step: stepElement.textContent,
                octave: parseInt(octaveElement.textContent || '4')
              },
              duration: duration,
              type: type,
              dot: !!dotElement
            });
          }
        }
      });
      
      return notes;
    } catch (error) {
      console.error('Error parsing MusicXML:', error);
      return [];
    }
  };

  // Fetch the music XML file when the selected file changes
  useEffect(() => {
    if (selectedFile === 'uploaded' && uploadedMusicXML) {
      setMusicXML(uploadedMusicXML);
    } else if (selectedFile !== 'uploaded') {
      fetch(`${import.meta.env.BASE_URL}${selectedFile}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to load the music XML file');
          }
          return response.text();
        })
        .then((data) => setMusicXML(data))
        .catch((error) => {
          console.error('Error loading the sheet music:', error);
          setMusicXML(null); // Clear musicXML in case of error
        });
    }
  }, [selectedFile, uploadedMusicXML]);

  useEffect(() => {
    if (musicXML && osmdContainerRef.current) {
      const osmd = new OpenSheetMusicDisplay.OpenSheetMusicDisplay(osmdContainerRef.current);
      osmd.load(musicXML).then(() => {
        osmd.render();
        osmdInstance.current = osmd;
      });
    }
  }, [musicXML]);

  // Keyboard handling and metronome toggling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent piano note logic if typing in an input or textarea
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }
      const key = event.key.toLowerCase();
      const note = (keyToNoteMap as any)[key];

      if (note && !activeSynths.current[key]) {
        if (startCoachingTimerRef.current == true) {
          console.log("starting coaching timer");
          coachingStartRef.current = Date.now();
          startCoachingTimerRef.current = false;
        }

        const synth = new Tone.Synth().toDestination();
        synth.triggerAttack(note);
        activeSynths.current[key] = synth;
        pressStartTimes.current[key] = Date.now();
        setHeldNotes((prev) => [...prev, note]);

        // Record the note if recording is active
        if (isRecording) {
          const currentTime = Date.now();
          const relativeTime = currentTime - recordingStartTime.current;
          setRecordedNotes(prev => [...prev, {
            note: note,
            startTime: relativeTime,
            duration: 0 // Will be set when key is released
          }]);
          setCurrentRecordingNotes(prev => [...prev, note]);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Prevent piano note logic if typing in an input or textarea
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }
      const key = event.key.toLowerCase();
      const note = (keyToNoteMap as any)[key];
      const synth = activeSynths.current[key];

      if (note && synth) {
        const start = pressStartTimes.current[key];
        if (start) {
          const duration = Date.now() - start;
          const coachingStartTime = coachingStartRef.current ? start - coachingStartRef.current : 0;
          console.log(`now: ${Date.now()}`)
          console.log(`coaching start: ${coachingStartRef.current}`)
          console.log(`poopy2: ${coachingStartTime}`)
          console.log(`Pressed '${key}' for ${duration} milliseconds`);

          noteHistoryRef.current.push({
            note: note,
            duration: duration,
            time: coachingStartTime
          });

          console.log(`note history: ${noteHistoryRef.current}`);
  
          const coachingEndTime = coachingStartTime + duration

          setAccuracy(calculateAccuracy(noteHistoryRef.current));
          const iou = calculateIou(coachingStartTime, coachingEndTime)

          iouListRef.current.push(iou);
          const sumIou = iouListRef.current.reduce((partialSum, a) => partialSum + a, 0);
          const avgIou = sumIou / iouListRef.current.length;
          setAvgIou(avgIou);
          console.log(`iou list: ${iouListRef.current}`);
          console.log(`avg iou: ${avgIou}`);

          // Update the duration of the recorded note if recording is active
          if (isRecording) {
            setRecordedNotes(prev => {
              const newNotes = [...prev];
              if (newNotes.length > 0) {
                newNotes[newNotes.length - 1].duration = duration;
              }
              return newNotes;
            });
          }

          delete pressStartTimes.current[key];

          const expectedNotesArr = formattedNotesRef.current.filter(n => n.note !== 'rest');
          const expectedIdx = correctNotePointer.current; // Next expected note index
          console.log(`Played note: ${note}, Expected note: ${expectedNotesArr[expectedIdx]?.note}, Index: ${expectedIdx}`);
          if (
            expectedNotesArr[expectedIdx] &&
            note === expectedNotesArr[expectedIdx].note // Compare full note including octave
          ) {
            console.log(`Correct note! Updating points...`);
            setCorrectNotes(prev => prev + 1);
            correctNotePointer.current += 1;
          }
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
  }, [octave, isRecording]);

  const toggleMetronome = () => {
    if (isMetronomeActive) {
      transport.stop();
      setIsMetronomeActive(false);
    } else {
      transport.start();
      setIsMetronomeActive(true);
    }
  };

  const toggleCoaching = () => {
    if (isCoachingActive) {
      coachingStartRef.current = null;
      setAccuracy(calculateAccuracy(noteHistoryRef.current));
      setShowMetrics(true);
      setIsCoachingActive(false);
    } else {
      startCoachingTimerRef.current = true
      iouListRef.current = [];
      noteHistoryRefOld.current = noteHistoryRef.current;
      noteHistoryRef.current = [];
      setAvgIou(0.0);
      setShowMetrics(false);
      setIsCoachingActive(true);

      // setIsSongPlaying(true);
      // playSong();
    }
  };

  useEffect(() => {
    console.log(`coaching start: ${coachingStart}`)
  }, [coachingStart]);

  const handleTempoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = Math.min(200, Math.max(60, Number(event.target.value)));
    setTempo(newTempo);
    transport.bpm.value = newTempo;
  };

  const handleTempoInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Temporarily store the value without applying it yet
    setTempo(Number(event.target.value));
  };

  // Update tempo when Enter is pressed
  const handleInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      let newTempo = Number((event.target as HTMLInputElement).value);
      newTempo = Math.min(200, Math.max(60, newTempo));
      setTempo(newTempo);
      transport.bpm.value = newTempo;
    }
  };

  useEffect(() => {
    const metronome = new Tone.MembraneSynth().toDestination();
    transport.scheduleRepeat(() => {
      metronome.triggerAttackRelease('C1', '8n');
    }, '4n');
  }, []);

  // Live feedback timer ref
  const liveFeedbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to send live feedback to AI
  async function sendLiveFeedbackToAI() {
    // Only use the last 10 played notes and expected notes for focused feedback
    const playedNotes = noteHistoryRef.current.slice(-10);
    const expectedNotes = formattedNotesRef.current.slice(noteHistoryRef.current.length - 10, noteHistoryRef.current.length);
    const feedbackPrompt = `You are a friendly piano coach. Here are the last 10 notes the user played: ${JSON.stringify(playedNotes)}. Here are the expected notes from the song: ${JSON.stringify(expectedNotes)}. Give a short, specific tip to help them match the rhythm and notes more closely. Only mention the most important thing to fix next. Be concise and encouraging.`;
    setSidebarMessages(msgs => [...msgs, { role: 'user', text: '[Live feedback request]' }]);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: feedbackPrompt,
      });
      // Remove Markdown formatting from AI response
      const cleanText = (response.text || 'No feedback received.')
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1') // italic
        .replace(/`([^`]*)`/g, '$1') // inline code
        .replace(/\n{2,}/g, '\n'); // collapse multiple newlines
      setSidebarMessages(msgs => [...msgs, { role: 'ai', text: cleanText }]);
    } catch (err) {
      setSidebarMessages(msgs => [...msgs, { role: 'ai', text: 'Error getting feedback from AI.' }]);
    }
  }

  // Start/stop live feedback when song starts/stops
  useEffect(() => {
    if (isSongPlaying) {
      liveFeedbackTimer.current = setInterval(() => {
        sendLiveFeedbackToAI();
      }, 5000);
      sendLiveFeedbackToAI();
    } else {
      if (liveFeedbackTimer.current) clearInterval(liveFeedbackTimer.current);
      liveFeedbackTimer.current = null;
    }
    return () => {
      if (liveFeedbackTimer.current) clearInterval(liveFeedbackTimer.current);
    };
  }, [isSongPlaying, song]);

  // Buffer for played notes and inactivity timer
  const noteBuffer = useRef<any[]>([]);
  const inactivityTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Watch for new notes played (manual or auto)
  useEffect(() => {
    if (noteHistoryRef.current.length === 0) return;
    // Get the last played note
    const lastNote = noteHistoryRef.current[noteHistoryRef.current.length - 1];
    noteBuffer.current.push(lastNote);
    // Reset inactivity timer
    if (inactivityTimeout.current) clearTimeout(inactivityTimeout.current);
    inactivityTimeout.current = setTimeout(() => {
      if (noteBuffer.current.length > 0) {
        sendLiveFeedbackSetToAI(noteBuffer.current);
        noteBuffer.current = [];
      }
    }, 3000); // 3 seconds of inactivity
  }, [noteHistoryRef.current.length]);

  // Helper to send feedback for a set of notes
  async function sendLiveFeedbackSetToAI(playedSet: any[]) {
    // Find the corresponding expected notes from the song
    const startIdx = noteHistoryRef.current.length - playedSet.length;
    const expectedSet = formattedNotesRef.current.slice(startIdx, startIdx + playedSet.length);
    const songName = uploadedSongName ? uploadedSongName : song;
    const feedbackPrompt = `You are an expert piano coach. The user is playing the song '${songName}'. Here are the notes they just played: ${JSON.stringify(playedSet)}. Here are the expected notes from the song: ${JSON.stringify(expectedSet)}. Give feedback in two short sentences: first, briefly analyze what they did well or not, and second, tell them exactly which note(s) to focus on or practice next, based on their mistakes or the song. Always include a note suggestion. Be concise and specific.`;
    setSidebarMessages(msgs => [...msgs, { role: 'user', text: '[Live feedback request]' }]);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: feedbackPrompt,
      });
      const cleanText = (response.text || 'No feedback received.')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\n{2,}/g, '\n');
      setSidebarMessages(msgs => [...msgs, { role: 'ai', text: cleanText }]);
    } catch (err) {
      setSidebarMessages(msgs => [...msgs, { role: 'ai', text: 'Error getting feedback from AI.' }]);
    }
  }

  // Recording functions
  const startRecording = () => {
    setIsRecording(true);
    setRecordedNotes([]);
    setCurrentRecordingNotes([]);
    recordingStartTime.current = Date.now();
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Send the recording to AI for analysis
    if (recordedNotes.length > 0) {
      sendRecordingToAI(recordedNotes);
    }
  };

  const sendRecordingToAI = async (notes: Array<{note: string, startTime: number, duration: number}>) => {
    const songName = uploadedSongName ? uploadedSongName : song;
    const expectedNotes = formattedNotesRef.current;
    
    // Calculate basic metrics
    const totalExpectedNotes = expectedNotes.filter(note => note.note !== 'rest').length;
    const totalPlayedNotes = notes.length;
    const accuracy = totalPlayedNotes > 0 ? Math.min(totalPlayedNotes / totalExpectedNotes, 1) : 0;
    
    // Analyze timing and rhythm
    const timingAnalysis = analyzeTiming(notes, expectedNotes);
    
    const feedbackPrompt = `Analyze this piano recording and give brief, direct feedback:

RECORDING: ${totalPlayedNotes} notes played
EXPECTED: ${totalExpectedNotes} notes in '${songName}'
ACCURACY: ${(accuracy * 100).toFixed(1)}%
TIMING: ${timingAnalysis.consistency}
RHYTHM: ${timingAnalysis.rhythmAccuracy}

Give 2-3 specific, actionable tips. Be direct and encouraging.`;

    setSidebarMessages(msgs => [...msgs, { role: 'user', text: '[Recording analysis request]' }]);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: feedbackPrompt,
      });
      const cleanText = (response.text || 'No feedback received.')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\n{2,}/g, '\n');
      setSidebarMessages(msgs => [...msgs, { role: 'ai', text: cleanText }]);
    } catch (err) {
      setSidebarMessages(msgs => [...msgs, { role: 'ai', text: 'Error analyzing recording.' }]);
    }
  };

  const analyzeTiming = (playedNotes: Array<{note: string, startTime: number, duration: number}>, expectedNotes: any[]) => {
    if (playedNotes.length < 2) {
      return { avgInterval: 0, consistency: 'Insufficient data', rhythmAccuracy: 'Insufficient data' };
    }

    // Calculate intervals between notes
    const intervals = [];
    for (let i = 1; i < playedNotes.length; i++) {
      intervals.push(playedNotes[i].startTime - playedNotes[i-1].startTime);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Calculate consistency (standard deviation)
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const consistency = stdDev < avgInterval * 0.3 ? 'Good' : stdDev < avgInterval * 0.5 ? 'Fair' : 'Needs work';

    // Compare with expected rhythm
    const expectedIntervals = [];
    for (let i = 1; i < expectedNotes.length; i++) {
      if (expectedNotes[i].note !== 'rest' && expectedNotes[i-1].note !== 'rest') {
        expectedIntervals.push(expectedNotes[i].time - expectedNotes[i-1].time);
      }
    }

    let rhythmAccuracy = 'Good';
    if (expectedIntervals.length > 0) {
      const expectedAvg = expectedIntervals.reduce((a, b) => a + b, 0) / expectedIntervals.length;
      const rhythmDiff = Math.abs(avgInterval - expectedAvg) / expectedAvg;
      rhythmAccuracy = rhythmDiff < 0.2 ? 'Good' : rhythmDiff < 0.4 ? 'Fair' : 'Needs work';
    }

    return { avgInterval: Math.round(avgInterval), consistency, rhythmAccuracy };
  };

  const playRecording = async () => {
    if (recordedNotes.length === 0) return;
    
    setIsPlayingBack(true);
    await Tone.start();
    
    // Use Tone.js Transport for precise timing
    Tone.Transport.cancel();
    Tone.Transport.stop();
    
    const synth = new Tone.Synth().toDestination();
    
    // Schedule all notes using Transport
    recordedNotes.forEach((recordedNote) => {
      const timeInSeconds = recordedNote.startTime / 1000;
      const durationInSeconds = recordedNote.duration / 1000;
      
      Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(recordedNote.note, durationInSeconds, time);
      }, timeInSeconds);
    });
    
    // Set the duration to the last note's end time
    const lastNote = recordedNotes[recordedNotes.length - 1];
    const totalDuration = (lastNote.startTime + lastNote.duration) / 1000;
    
    Tone.Transport.start();
    
    // Stop after the recording duration
    setTimeout(() => {
      Tone.Transport.stop();
      setIsPlayingBack(false);
    }, totalDuration * 1000);
  };

  const clearRecording = () => {
    setRecordedNotes([]);
  };

  // Progress bar state
  const [progress, setProgress] = useState(0); // 0 to 1
  const [correctNotes, setCorrectNotes] = useState(0);
  const correctNotePointer = useRef(0); // pointer to the next expected note

  // Progress tracking
  const [songProgress, setSongProgress] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [completedNotes, setCompletedNotes] = useState(0);

  // Point system
  const [points, setPoints] = useState(() => {
    const savedPoints = localStorage.getItem('fusionPoints');
    return savedPoints ? parseInt(savedPoints) : 0;
  });
  const [showPointReward, setShowPointReward] = useState(false);
  const [lastProgressMilestone, setLastProgressMilestone] = useState(0);

  // Song store system
  const [unlockedSongs, setUnlockedSongs] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlockedSongs');
    return saved ? JSON.parse(saved) : [];
  });

  // Sample song data (you'll need to create the actual JSON files)
  const furEliseData = [
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'D', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'D', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'B', octave: 3 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'D', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'C', octave: 4 }, duration: '240', type: 'half', dot: false }
  ];

  const moonlightSonataData = [
    { pitch: { step: 'C', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'G', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'C', octave: 5 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'E', octave: 5 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'G', octave: 5 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'C', octave: 6 }, duration: '240', type: 'half', dot: false }
  ];

  const odeToJoyData = [
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'F', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'G', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'G', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'F', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'E', octave: 4 }, duration: '120', type: 'quarter', dot: false },
    { pitch: { step: 'D', octave: 4 }, duration: '240', type: 'half', dot: false }
  ];

  const lockedSongs = [
    { name: 'fur_elise', label: 'Für Elise', cost: 150, data: furEliseData },
    { name: 'moonlight_sonata', label: 'Moonlight Sonata', cost: 300, data: moonlightSonataData },
    { name: 'ode_to_joy', label: 'Ode to Joy', cost: 200, data: odeToJoyData }
  ];

  const unlockSong = (songName: string) => {
    const songToUnlock = lockedSongs.find(s => s.name === songName);
    if (songToUnlock && points >= songToUnlock.cost) {
      setPoints(prev => {
        const newPoints = prev - songToUnlock.cost;
        localStorage.setItem('fusionPoints', newPoints.toString());
        return newPoints;
      });
      setUnlockedSongs((prev: string[]) => {
        const newUnlocked = [...prev, songName];
        localStorage.setItem('unlockedSongs', JSON.stringify(newUnlocked));
        return newUnlocked;
      });
      // Add song data to songData object
      songData[songName] = songToUnlock.data;
    }
  };

  // Update progress only on correct notes
  useEffect(() => {
    // Only count non-rest notes for progress
    const totalPlayableNotes = formattedNotesRef.current.filter(n => n.note !== 'rest').length;
    const currentProgress = totalPlayableNotes > 0 ? correctNotes / totalPlayableNotes : 0;
    setProgress(currentProgress);
    
    // Point system logic - award points for each correct note
    const progressPercentage = Math.round(currentProgress * 100);
    
    // Award points for each correct note (smaller amounts)
    if (correctNotes > 0 && correctNotes > lastProgressMilestone) {
      const pointsEarned = 5; // Award 5 points per correct note
      console.log(`Awarding ${pointsEarned} points for correct note! Total correct: ${correctNotes}`);
      setPoints(prev => {
        const newPoints = prev + pointsEarned;
        localStorage.setItem('fusionPoints', newPoints.toString());
        return newPoints;
      });
      setLastProgressMilestone(correctNotes);
      setShowPointReward(true);
      setTimeout(() => setShowPointReward(false), 1500);
    }
    
    // Bonus points at milestones
    if (progressPercentage >= 50 && lastProgressMilestone < 50) {
      const pointsEarned = 25;
      setPoints(prev => {
        const newPoints = prev + pointsEarned;
        localStorage.setItem('fusionPoints', newPoints.toString());
        return newPoints;
      });
      setLastProgressMilestone(50);
      setShowPointReward(true);
      setTimeout(() => setShowPointReward(false), 3000);
    }
    
    if (progressPercentage >= 100 && lastProgressMilestone < 100) {
      const pointsEarned = 100;
      setPoints(prev => {
        const newPoints = prev + pointsEarned;
        localStorage.setItem('fusionPoints', newPoints.toString());
        return newPoints;
      });
      setLastProgressMilestone(100);
      setShowPointReward(true);
      setTimeout(() => setShowPointReward(false), 3000);
    }
  }, [correctNotes, song, lastProgressMilestone]);

  // Reset progress, correct notes, and pointer on song change
  useEffect(() => {
    setProgress(0);
    setCorrectNotes(0);
    correctNotePointer.current = 0;
    setLastProgressMilestone(0);
  }, [song, uploadedSongData]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 relative">
      <div className={`max-w-screen-2xl mx-auto px-8 py-16 flex flex-col lg:flex-row gap-14 items-stretch max-h-[95vh] pb-24${sidebarOpen ? ' mr-96' : ''}`}>
                  {/* Left: Sheet music and controls */}
          <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-md p-10 flex-1 min-h-0 overflow-y-auto">
            <div className="mb-6 flex flex-col gap-2">
              <label className="block text-base font-semibold text-gray-700">Upload MXL:</label>
              <input
                type="file"
                accept=".mxl"
                onChange={handleMusicXMLUpload}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="sheet-music-dropdown" className="block text-lg font-semibold mb-2">
                {uploadedSongName ? `Current: ${uploadedSongName}` : 'Select Sheet Music:'}
              </label>
              <select
                id="sheet-music-dropdown"
                value={selectedFile}
                onChange={handleFileChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {sheetMusicFiles.map((music) => (
                  <option key={music.file} value={music.file}>
                    {music.label}
                  </option>
                ))}
                {uploadedMusicXML && (
                  <option value="uploaded">Uploaded Song</option>
                )}
              </select>
            </div>

          <div className="mb-4 flex items-center space-x-4">
            <button
              onClick={isSongPlaying ? stopSong : playSong}
              className={`px-4 py-2 rounded-md font-semibold shadow transition-colors duration-150 text-white ${isSongPlaying ? 'bg-gray-800 hover:bg-gray-900' : 'bg-gray-700 hover:bg-gray-800'}`}
            >
              {isSongPlaying ? 'Stop Song' : 'Play Song'}
            </button>
            <label className="flex items-center text-lg font-semibold">
              <input
                type="checkbox"
                checked={isMetronomeActive2}
                onChange={() => setIsMetronomeActive2(prev => !prev)}
                className="mr-2"
              />
              Metronome On
            </label>
          </div>

          {/* Sheet music viewer */}
          <div className="mt-4 w-full px-2">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                className="bg-black h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Progress: {Math.round(progress * 100)}%
              </p>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6-6m0 0l6 6m-6-6v12a6 6 0 01-6 6v-6" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{points} pts</span>
              </div>
            </div>
            
            {/* Point Reward Notification */}
            {showPointReward && (
              <motion.div
                className="fixed top-4 right-4 bg-white border border-gray-200 text-gray-800 px-6 py-4 rounded-xl shadow-xl z-50 backdrop-blur-sm"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-sm">+{lastProgressMilestone === 50 ? 25 : lastProgressMilestone === 100 ? 100 : 5} points earned</span>
                </div>
              </motion.div>
            )}
            {musicXML ? (
              <div
                ref={osmdContainerRef}
                className="w-full"
                style={{ minWidth: '0', overflowX: 'auto', background: 'white', borderRadius: '0.75rem' }}
              />
            ) : (
              <p className="text-center text-lg text-gray-600">Loading sheet music...</p>
            )}
          </div>
        </div>
        {/* Right: Controls, keyboard, metrics */}
        <div className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-md p-10 flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-row items-center w-full gap-3 mb-4">
            {/* Play/Pause Icon Button */}
            <button
              onClick={toggleMetronome}
              className="flex items-center justify-center p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition w-[44px] h-[44px]"
              aria-label={isMetronomeActive ? 'Pause Metronome' : 'Start Metronome'}
              title={isMetronomeActive ? 'Pause Metronome' : 'Start Metronome'}
            >
              {isMetronomeActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <polygon points="6,4 20,12 6,20" />
                </svg>
              )}
            </button>
            {/* Metronome Card */}
            <div className="flex items-center justify-center gap-6 bg-gray-50 rounded-xl shadow-sm px-4 py-2 flex-1 min-h-0" style={{ height: '44px' }}>
              <span className="font-semibold text-gray-700 text-center flex items-center h-10">Tempo</span>
              <input
                id="tempo-slider"
                type="range"
                min="60"
                max="200"
                value={tempo}
                onChange={handleTempoChange}
                className="flex-1 accent-gray-700 h-3 rounded-lg appearance-none cursor-pointer bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 ml-2"
                style={{ maxWidth: '360px' }}
              />
              <input
                id="tempo-input"
                type="number"
                value={tempo}
                onChange={handleTempoInput}
                onKeyDown={handleInputKeyDown}
                min="60"
                max="200"
                className="w-16 h-10 p-0 bg-transparent border-0 text-center font-bold focus:ring-0 focus:outline-none mx-auto flex items-center"
              />
            </div>
          </div>

          <Keyboard octave={octave} setOctave={setOctave} />

          {/* Recording Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-medium transition-all duration-200"
            >
              {isRecording ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Stop
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  Record
                </>
              )}
            </button>
            
            {!isRecording && recordedNotes.length > 0 && (
              <>
                <button
                  onClick={playRecording}
                  disabled={isPlayingBack}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-medium transition-all duration-200 ${
                    isPlayingBack ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isPlayingBack ? 'Playing...' : 'Preview'}
                </button>
                
                <button
                  onClick={clearRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 font-medium transition-all duration-200"
                >
                  Clear
                </button>
              </>
            )}
            
            {recordedNotes.length > 0 && (
              <span className="text-sm text-gray-500">
                {recordedNotes.length} notes
              </span>
            )}
          </div>

          {/* Show current recording notes */}
          {isRecording && currentRecordingNotes.length > 0 && (
            <div className="mt-3 text-center">
              <div className="text-sm text-gray-600 mb-1">Playing:</div>
              <div className="flex flex-wrap justify-center gap-1">
                {currentRecordingNotes.slice(-8).map((note, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center">
            <button
              onClick={toggleCoaching}
              className={`px-4 py-2 rounded-md font-semibold shadow transition-colors duration-150 text-white ${isCoachingActive ? 'bg-gray-800 hover:bg-gray-900' : 'bg-gray-700 hover:bg-gray-800'}`}
            >
              {isCoachingActive ? 'Stop Coaching' : 'Start Coaching'}
              </button>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex flex-col items-start space-y-2">
              {showMetrics ? (
                <div>
                  <div className="text-lg font-semibold">Rhythm Metrics:</div>
                  <div className="text-xl text-gray-700">
                    {(avgIou && !isNaN(avgIou)) ? (avgIou * 100).toFixed(2) + '%' : '0%'}
                  </div>
                </div>
              ) : !isCoachingActive ? (
                <div className="text-xl text-gray-700">
                  Please complete a coaching session to view your rhythm metrics and note accuracy.
                </div>
              ) : (
                <div>
                  <div className="text-xl text-gray-700">You got this!</div>
                  <div className="text-lg font-semibold">Rhythm Metrics:</div>
                  <div className="text-xl text-gray-700">
                    {(avgIou && !isNaN(avgIou)) ? (avgIou * 100).toFixed(2) + '%' : '0%'}
                  </div>
                  <div className="text-lg font-semibold">Note Accuracy:</div>
                  <div className="text-xl text-gray-700">
                    {(accuracy && !isNaN(accuracy)) ? (accuracy * 100).toFixed(2) + '%' : '0%'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start space-y-2">
              {showMetrics && (
                <div>
                  <div className="text-lg font-semibold">Note Accuracy:</div>
                  <div className="text-xl text-gray-700">
                    {showMetrics ? 
                      (isNaN(accuracy) ? '0.00%' : (accuracy * 100).toFixed(2) + '%') 
                    : ''}
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Chat Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-lg w-full max-h-[400px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Gemini response: </h2>
              <div className="flex-1 overflow-y-auto mb-4">
                <p>{text}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)} // Close modal when clicked
                className="mt-4 bg-red-500 text-white p-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Bottom Dock */}
        {/* Chat icon in dock toggles sidebar open/close, always visible, styled like other icons */}
        <div className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-12 bg-white/90 shadow-lg rounded-full px-16 py-3 border border-gray-200 backdrop-blur${sidebarOpen ? ' mr-96' : ''}`}> 
          {/* Home Icon */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition"
            aria-label="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4.5 10.5V21h15V10.5" />
            </svg>
          </button>
          {/* Chat Icon (toggle sidebar) */}
          <button
            onClick={() => setSidebarOpen(open => !open)}
            className={`flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition ${sidebarOpen ? 'bg-gray-200' : ''}`}
            aria-label={sidebarOpen ? 'Close AI Coach Chat' : 'Open AI Coach Chat'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4-4.03 7-9 7-1.13 0-2.22-.13-3.24-.37-.36-.09-.54-.13-.7-.13-.13 0-.26.03-.38.08l-2.32.93a.75.75 0 01-.97-.97l.93-2.32c.05-.12.08-.25.08-.38 0-.16-.04-.34-.13-.7C3.13 14.22 3 13.13 3 12c0-5 3-9 9-9s9 4 9 9z" />
            </svg>
          </button>
          {/* Gemini Icon */}
          <button
            onClick={chatFeature}
            className="flex items-center justify-center p-2 rounded-full hover:bg-blue-100 transition"
            aria-label="Gemini Chat"
          >
            <img src="gemini_icon.png" alt="Chat" className="h-10 w-10 filter grayscale" />
          </button>
        </div>
      </div>
      {/* Live AI Coach Sidebar */}
      {sidebarOpen && (
        <div ref={sidebarRef} className="fixed top-0 right-0 h-full w-96 bg-white/70 backdrop-blur-lg border-l border-gray-200 shadow-2xl flex flex-col z-50 rounded-l-3xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/60 backdrop-blur-lg">
            <span className="font-bold text-xl tracking-tight text-gray-800">Genie</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition">×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-transparent">
            {sidebarMessages.map((msg, i) => (
              <div key={i} className={msg.role === 'ai' ? 'flex justify-start' : 'flex justify-end'}>
                <div className={
                  msg.role === 'ai'
                    ? 'bg-blue-100 text-blue-900 rounded-2xl rounded-bl-none px-4 py-2 max-w-xs shadow-sm'
                    : 'bg-gray-800 text-white rounded-2xl rounded-br-none px-4 py-2 max-w-xs shadow-sm'
                }>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-200 mx-6" />
          <form className="p-4 flex gap-2 bg-white/60 backdrop-blur-lg" onSubmit={e => { e.preventDefault(); handleSidebarSend(); }}>
            <input
              type="text"
              value={sidebarInput}
              onChange={e => setSidebarInput(e.target.value)}
              placeholder="Ask about your playing..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white/80 shadow-sm"
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow transition" aria-label="Send">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a2 2 0 002 2h12a2 2 0 002-2v-2.5M16 12l-4-4m0 0l-4 4m4-4v12" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
    
  );
}

export default SheetMusicOSMD;
