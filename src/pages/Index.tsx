import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import QuarterNotes from '../components/QuarterNotes';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Quarter Notes */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <QuarterNotes />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 space-y-12 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="text-6xl md:text-8xl font-extrabold font-borel pointer-events-auto text-black mt-16"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          Fusion
        </motion.h1>

        <motion.p
          className="text-2xl pointer-events-auto text-gray-700/90 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Unlock Your Inner Musician.
        </motion.p>

        {/* Feature highlights */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            <span className="text-black">✓</span>
            <span className="text-sm font-medium text-gray-700">AI-Powered Feedback</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            <span className="text-black">🎵</span>
            <span className="text-sm font-medium text-gray-700">Sheet Music</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
            <span className="text-black">⏱️</span>
            <span className="text-sm font-medium text-gray-700">Rhythm Training</span>
          </div>
        </motion.div>

        <motion.button
          className="px-8 py-3 rounded-full bg-black text-white text-lg font-bold pointer-events-auto transition-transform duration-200 hover:scale-105 hover:bg-gray-900"
          onClick={() => {
            const modal = document.getElementById("tool_modal") as HTMLDialogElement | null;
            modal?.showModal();
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started
        </motion.button>

        <dialog id="tool_modal" className="modal">
          <div className="modal-box bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 max-w-4xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Practice Tool</h3>
              <p className="text-gray-600 text-lg">Select the experience that best fits your learning goals</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Piano Room Card */}
              <div className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer flex flex-col" onClick={() => navigate('/sheets')}>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-black">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Piano Room</h2>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                  Learn piano songs, earn progress rewards, and get personalized feedback from Google Gemini AI to help you improve.
                </p>
                <button className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Enter Room
                </button>
              </div>

              {/* Rhythm Trainer Card */}
              <div className="group bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer flex flex-col" onClick={() => navigate('/rhythm')}>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-black">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Rhythm Trainer</h2>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed flex-grow">
                  Enhance your timing and coordination with engaging rhythm challenges and beat training exercises.
                </p>
                <button className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Start Training
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <form method="dialog">
                <button className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors duration-200">
                  Maybe Later
                </button>
              </form>
            </div>
          </div>
        </dialog>
      </motion.div>
    </div>
  );
};

export default Home;