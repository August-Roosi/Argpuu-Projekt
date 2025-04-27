import React, { useCallback } from 'react';
import { ControlButton} from '@xyflow/react';
import { GrUndo } from "react-icons/gr";
import { Controls } from '@xyflow/react';
import useArgumentStore from '../stores/ArgumentStore';
import { AppState } from '../nodes/types';
import toast from 'react-hot-toast';

interface ToolbarProps {

}

const Toolbar: React.FC<ToolbarProps> = ({  }) => {

    const undo = useArgumentStore((state: AppState) => state.undo);
    const reloadMap = useArgumentStore((state: AppState) => state.reloadMap);
    const onUndo = useCallback(async() => {
        const result = await undo();
        if (result[0] === 0) {
            toast.error(result[1]);
        } else {
            toast.success(result[1]);
            reloadMap()
        }
    },[]);

    return (
        <div>
            <Controls orientation='horizontal' position='bottom-center' className='bg-gray-100 shadow-md'>
                <ControlButton onClick={onUndo}>
                    <GrUndo />
                </ControlButton>
            </Controls>
        </div>
    );
};

export default Toolbar;
