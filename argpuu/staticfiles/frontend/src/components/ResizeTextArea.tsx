import React, { useRef, useEffect } from 'react';

interface ResizeTextArea extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const ResizeTextArea: React.FC<ResizeTextArea> = ({ value, onChange, ...props }) => {
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (el) {
            el.style.height = 'auto'; 
            el.style.height = el.scrollHeight + 'px'; 
        }
    }, [value]);

    return (
        <textarea
            {...props}
            ref={ref}
            value={value}
            onChange={onChange}
            rows={1}
            className={`overflow-hidden resize-none ${props.className ?? ''}`}
        />
    );
};

export default ResizeTextArea;
