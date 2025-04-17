import React from 'react';
import { Panel } from '@xyflow/react';


interface TitleBarProps {
    title: string;
    targetUrl: string;
}

const Titlebar: React.FC<TitleBarProps> = ({ title, targetUrl }) => {
    return (
        <div>
            <Panel position='top-left' className='flex flex justify-between items-center bg-gray-100 py-2 px-4 shadow-md'>
                <button onClick={() => window.location.href = targetUrl}>{"<-"}</button>
                <div></div>
            </Panel>
            <Panel position='top-center' className='flex justify-center gap-2 items-center bg-gray-100 py-4 px-6 shadow-md'>
                <h1>{title}</h1>
                <h2>author</h2>
            </Panel>
        </div>
    );
};

export default Titlebar;
