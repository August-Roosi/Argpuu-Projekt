import React, { useState, useCallback, useEffect } from 'react';
import { Panel } from '@xyflow/react';
import { IoArrowBack } from "react-icons/io5";
import { getCSRFToken } from '../utils/getCSRFToken';
import toast from 'react-hot-toast';


interface TitleBarProps {
    title: string;
    targetUrl: string;
    author: string;
    argumentMapId: string;
}

const Titlebar: React.FC<TitleBarProps> = ({ title, targetUrl, author, argumentMapId }) => {
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
        updateTitle(currentTitle);

    }, [currentTitle]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            updateTitle(currentTitle);

        }
    }, [currentTitle]);


    const csrfToken = getCSRFToken();

    const updateTitle = async (newTitle: string) => {
        try {
            const response = await fetch(`/api/argument_maps/${argumentMapId}/`, {
                method: 'PATCH',
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || '',
                }),
                credentials: 'include',
                body: JSON.stringify({
                    title: newTitle,
                }),
            });

            if (!response.ok) {
                toast.error("Argumendi uuendamine ebaõnnestus!");
                return;
            }

            toast.success("Argument edukalt uuendatud!");
        } catch (err) {
            console.error("Error updating argument:", err);
            toast.error("Tekkis ootamatu viga argumendi uuendamisel!");
        }
    };
    
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
