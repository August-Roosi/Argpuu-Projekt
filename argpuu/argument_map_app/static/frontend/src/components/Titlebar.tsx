import React, { useState, useCallback, useEffect } from 'react';
import { Panel } from '@xyflow/react';
import { IoArrowBack } from "react-icons/io5";

interface TitleBarProps {
    title: string;
    targetUrl: string;
    author: string;
}

const Titlebar: React.FC<TitleBarProps> = ({ title, targetUrl, author }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentTitle, setCurrentTitle] = useState(title);
    const [isFlashing, setIsFlashing] = useState(false);

    const handleDoubleClick = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleClick = useCallback(() => {
        setIsFlashing(true);
    }
    , []);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
        }
    }, []);

    useEffect(() => {
        if (isFlashing) {
            const timer = setTimeout(() => setIsFlashing(false), 200); 
            return () => clearTimeout(timer);
        }
    }, [isFlashing]);

    return (
        <div>
            <Panel position='top-left' className='flex justify-between items-center bg-gray-100 shadow-md'>
                <button
                    className='py-2 px-4 focus:bg-gray-800 '
                    onClick={() => window.location.href = targetUrl}
                >
                    <IoArrowBack />
                </button>
                <div></div>
            </Panel>

            <Panel position='top-center' className={`flex transition-colors duration-300 justify-center gap-4 items-center bg-gray-100 py-4 px-6 shadow-md 
                        ${isFlashing ? 'animate-radiate bg-yellow-300' : ''
                        }`}>
                {isEditing ? (
                    <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="text-xl bg-white border border-gray-300 rounded px-2 py-1"
                    />
                ) : (
                    <h1
                        className="text-xl cursor-pointer  px-2 py-1 rounded"
                        onDoubleClick={handleDoubleClick}
                        onClick={handleClick}
                    >
                        {currentTitle}
                    </h1>
                )}
                <h3 className='text-xs text-gray-600'>Autor: {author}</h3>
            </Panel>
        </div>
    );
};

export default Titlebar;
