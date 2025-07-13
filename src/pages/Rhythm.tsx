import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import * as Tone from 'tone';
import { motion, useAnimation, AnimationControls } from 'framer-motion';
import { generateRandomMeasure, generateRandomMusicXML } from '../utils/rhythm';
import OSMDRenderer from '../components/OSMDRenderer';

type Tab = 'practice' | 'measure' | 'game';

const Rhythm: React.FC = () => {
  const navigate = useNavigate();

  // Common state variables
  const [bpm, setBpm] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<Tab>('practice');

  // Practice view state
  const [feedback, setFeedback] = useState<string>('');
  const [started, setStarted] = useState<boolean>(false);

  // Measure view state
  const [measureXML, setMeasureXML] = useState<string>('');
  const [measureCountdown, setMeasureCountdown] = useState<number | null>(null);
  const [measureActive, setMeasureActive] = useState<boolean>(false);
  const [measureFinished, setMeasureFinished] = useState<boolean>(false);
  const [measureExpectedBeatTimes, setMeasureExpectedBeatTimes] = useState<number[]>([]);
  const [measureUserTaps, setMeasureUserTaps] = useState<number[]>([]);
  const [measureFeedbackArray, setMeasureFeedbackArray] = useState<string[]>([]);
  const [measureDurations, setMeasureDurations] = useState<number[]>([]);

  // Refs & Animation controls (shared)
  const beatTimesRef = useRef<number[]>([]);
  const pulseControls: AnimationControls = useAnimation();

  // Generate a new music measure
  const generateNewMeasure = (): void => {
    const measure = generateRandomMeasure(); // e.g., [1, 0.5, 0.5, 1]
    setMeasureDurations(measure);
    console.log('Generated measure:', measure);
    const xml = generateRandomMusicXML(measure);
    setMeasureXML(xml);
  };

  // When switching to Measure view, generate a new measure and reset measure state
  useEffect(() => {
    if (activeTab === 'measure') {

      if (!measureXML) {
        generateNewMeasure();
      }

      setMeasureCountdown(null);
      setMeasureActive(false);
      setMeasureFinished(false);
      setMeasureExpectedBeatTimes([]);
      setMeasureUserTaps([]);
      setMeasureFeedbackArray([]);
    }
  }, [activeTab]);

  // Countdown metronome tick effect (plays a tick on each countdown update)
  useEffect(() => {
    if (activeTab !== 'measure' || measureCountdown === null || measureCountdown <= 0)
      return;
    const countdownSynth = new Tone.MembraneSynth().toDestination();
    countdownSynth.triggerAttackRelease("C2", "8n");
  }, [measureCountdown, activeTab]);

  // PRACTICE VIEW: Metronome & Tapping
  useEffect(() => {
    if (!started) return;

    Tone.Transport.bpm.value = bpm;
    const synth = new Tone.MembraneSynth().toDestination();

    const tickCallback = (time: number): void => {
      synth.triggerAttackRelease("C2", "8n", time);
      beatTimesRef.current.push(time);
      Tone.Draw.schedule(() => {
        pulseControls.start({
          scale: [1, 1.25, 1],
          transition: { duration: 0.4, ease: 'easeInOut' },
        });
      }, time);
    };

    const loopId = Tone.Transport.scheduleRepeat(tickCallback, "4n");

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }

    return () => {
      Tone.Transport.clear(loopId);
    };
  }, [started, bpm, pulseControls]);


  // MEASURE VIEW: Countdown and 4-Beat Measure
  // When the user clicks the “Start” button in Measure view, reset state and begin the countdown.
  const startMeasure = async (): Promise<void> => {
    await Tone.start();
    // Reset measure state
    beatTimesRef.current = [];
    setMeasureCountdown(4);
    setMeasureActive(false);
    setMeasureFinished(false);
    setMeasureExpectedBeatTimes([]);
    setMeasureUserTaps([]);
    setMeasureFeedbackArray([]);
  };

  // Countdown effect: decrement every second until reaching 0, then activate measure mode.
  useEffect(() => {
    if (measureCountdown === null) return;

    const secondsPerBeat = 60 / bpm;

    if (measureCountdown > 0) {
      const timer = setTimeout(() => {
        setMeasureCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, secondsPerBeat * 1000); // Adjust countdown speed based on BPM
      return () => clearTimeout(timer);
    } else {
      // Countdown finished; now activate measure mode.
      setMeasureActive(true);
    }
  }, [measureCountdown]);

  // Once measureActive is true, schedule exactly 4 beats with no additional delay.
  useEffect(() => {
    if (activeTab !== 'measure' || !measureActive || measureDurations.length === 0)
      return;
  
    Tone.Transport.bpm.value = bpm;
    const synth = new Tone.MembraneSynth().toDestination();
    const startTime = Tone.now(); // Start immediately with no delay
    const newExpectedBeats: number[] = [];
  
    let cumulativeBeats = 0;
    for (const duration of measureDurations) {
      const beatTime = startTime + cumulativeBeats * (60 / bpm);
      newExpectedBeats.push(beatTime);
      Tone.Transport.schedule((time: number) => {
        synth.triggerAttackRelease("C2", "8n", time);
        Tone.Draw.schedule(() => {
          pulseControls.start({
            scale: [1, 1.25, 1],
            transition: { duration: 0.4, ease: 'easeInOut' },
          });
        }, time);
      }, beatTime);
      cumulativeBeats += duration;
    }
  
    setMeasureExpectedBeatTimes(newExpectedBeats);
  
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }, [activeTab, measureActive, bpm, pulseControls, measureDurations]);

  
  // Resets 
  const resetMeasure = (): void => {
    setMeasureCountdown(null);
    setMeasureActive(false);
    setMeasureFinished(false);
    setMeasureExpectedBeatTimes([]);
    setMeasureUserTaps([]);
    setMeasureFeedbackArray([]);
    generateNewMeasure();
  };

  const replayMeasure = (): void => {
    setMeasureCountdown(null);
    setMeasureActive(false);
    setMeasureFinished(false);
    setMeasureExpectedBeatTimes([]);
    setMeasureUserTaps([]);
    setMeasureFeedbackArray([]);
  };


  // Global Spacebar Listener for Tapping
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent): void => {
      if (e.code !== 'Space') return;

      // Measure view: record tap only if measure mode is active, not finished, and an expected beat is available.
      if (activeTab === 'measure' && measureActive && !measureFinished) {
        if (measureUserTaps.length < measureExpectedBeatTimes.length) {
          const now = Tone.now();
          const index = measureUserTaps.length;
          const expectedTime = measureExpectedBeatTimes[index];
          const errorMs = (now - expectedTime) * 1000;
          const rating = Math.abs(errorMs) <= 150 ? '✅' : '❌';
          const sign = errorMs >= 0 ? '+' : '-';
          const feedbackMsg = `Beat ${index + 1}: ${rating} (${sign}${Math.abs(errorMs).toFixed(1)} ms)`;

          setMeasureFeedbackArray((prev) => [...prev, feedbackMsg]);
          setMeasureUserTaps((prev) => [...prev, now]);

          // When the required number of taps is reached, mark the measure as finished.
          if (index + 1 === measureExpectedBeatTimes.length) {
            setMeasureFinished(true);
          }
        }
      }
      // In Practice view, use existing behavior.
      else if (activeTab === 'practice' && started) {
        const now = Tone.now();
        const beatTimes = beatTimesRef.current;
        let signedDiff = 0;
        let smallestAbsDiff = Infinity;

        for (const beatTime of beatTimes) {
          let diff = now - beatTime;
          if (diff > 0.9) diff -= 1.0;
          const absDiff = Math.abs(diff);
          if (absDiff < smallestAbsDiff) {
            smallestAbsDiff = absDiff;
            signedDiff = diff;
          }
        }
        // Clean up old beats.
        while (beatTimes.length > 0 && beatTimes[0] < now - 1) {
          beatTimes.shift();
        }
        const errorMs = signedDiff * 1000;
        const rating = Math.abs(errorMs) <= 150 ? '🎯 Great!' : '❌ Miss';
        const sign = errorMs >= 0 ? '+' : '-';
        setFeedback(`${rating} (${sign}${Math.abs(errorMs).toFixed(1)} ms)`);
      }
    };

    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [
    activeTab,
    measureActive,
    measureFinished,
    measureExpectedBeatTimes,
    measureUserTaps,
    started,
  ]);


  // Handlers for BPM and Tab toggles
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setBpm(Number(e.target.value));
  };

  // Toggle Practice metronome start/stop
  const toggleMetronome = async (): Promise<void> => {
    if (!started) {
      await Tone.start();
      await Tone.Transport.start();
      setStarted(true);
    } else {
      Tone.Transport.stop();
      setStarted(false);
      beatTimesRef.current = [];
      setFeedback('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl md:text-6xl font-borel font-extrabold mb-6">
        rhythm trainer
      </h1>

      <div className="tabs tabs-lift mb-4 w-sm sm:w-xl md:w-3xl">
        {/* PRACTICE TAB */}
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Practice"
          checked={activeTab === 'practice'}
          onChange={() => setActiveTab('practice')}
        />
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <p className="mb-4">Tap the space bar in sync with the metronome.</p>

          {/* BPM Control */}
          <div className="mb-6">
            <label className="label justify-center mr-2">
              <span className="label-text text-lg">BPM: {bpm}</span>
            </label>
            <input
              type="range"
              min="40"
              max="120"
              value={bpm}
              onChange={handleBpmChange}
              className="range range-neutral w-full max-w-xs mx-auto"
              disabled={!started}
            />
            <div className="flex justify-between text-xs px-2 w-full max-w-xs mx-auto">
              <span>40</span>
              <span>55</span>
              <span>80</span>
              <span>110</span>
            </div>
          </div>

          {/* Start/Stop Button for Practice */}
          <button className="btn btn-neutral mb-6" onClick={toggleMetronome}>
            {started ? 'Stop Metronome' : 'Start Metronome'}
          </button>

          {/* Beat Pulse Animation */}
          <div className="flex items-center justify-center">
            <motion.div
              className="w-16 h-16 bg-neutral rounded-full"
              animate={started ? pulseControls : {}}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Practice Feedback */}
          {started && (
            <div className="mt-4">
              <p className="text-xl">{feedback}</p>
            </div>
          )}
        </div>

        {/* MEASURE VIEW TAB */}
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Measure Reading"
          checked={activeTab === 'measure'}
          onChange={() => setActiveTab('measure')}
        />
        <div className="tab-content bg-base-100 border-base-300 p-6">
          <h2 className="text-xl font-bold mb-2">Measure Reading Activity</h2>
          
          {/* Measure */}
          {measureXML ? (
            <OSMDRenderer musicXML={measureXML} />
          ) : (
            <p className="text-gray-500 italic">Loading measure...</p>
          )}

          {/* Measure Controls */}
          {activeTab === 'measure' && (
            <>
              {/* Show the Start button if the measure isn’t running */}
              {!measureActive && measureCountdown === null && !measureFinished && (
                <button className="btn btn-primary mt-4 mr-5" onClick={startMeasure}>
                  Start
                </button>
              )}
              {/* Display the countdown */}
              {measureCountdown !== null && measureCountdown > 0 && (
                <div className="text-4xl font-bold mt-4">{measureCountdown}</div>
              )}
              {/* Prompt during the active 4-beat measure */}
              {measureActive && !measureFinished && (
                <div className="mt-4 text-xl font-bold">
                  Tap the space bar for each beat!
                </div>
              )}
              {/* Live feedback for each beat */}
              {measureFeedbackArray.length > 0 && (
                <div className="mt-4">
                  {measureFeedbackArray.map((msg, idx) => (
                    <p key={idx} className="text-xl">
                      {msg}
                    </p>
                  ))}
                </div>
              )}
              {/* Reset button after exercise is over */}
              {measureFinished && (
                <div>
                  <button
                    className="btn btn-secondary mt-4 mr-5"
                    onClick={resetMeasure}
                  >
                    Reset Exercise
                  </button>

                  <button
                  className="btn btn-secondary mt-4 mr-5"
                  onClick={replayMeasure}
                  >
                  Replay Exercise
                  </button>
                </div>
              )}
            </>
          )}

          {!measureActive && !measureFinished && measureCountdown === null && (
            <button className="btn btn-outline mt-4" onClick={generateNewMeasure}>
              Generate New Measure
            </button>
          )}
        </div>
      </div>

      {/* Dock */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-12 bg-white/90 shadow-lg rounded-full px-16 py-3 border border-gray-200 backdrop-blur">
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
      </div>
    </div>
  );
};

export default Rhythm;