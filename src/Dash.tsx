import React, { useEffect, useState } from 'react'

function Dash() {
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('isRunning');
        if (savedState === 'true') {
            setIsRunning(true);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('isRunning', isRunning);
    }, [isRunning]);

    const handleButtonClick = () => {
        setIsRunning(prev => !prev);
    }

    return (
        <div>
            <p>Dashboard</p>
            <button 
                onClick={handleButtonClick}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isRunning ? '#de0d0d' : '#11c246',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                {isRunning ? 'Stop' : 'Start'}
            </button>
        </div>
    );
}
export default Dash
