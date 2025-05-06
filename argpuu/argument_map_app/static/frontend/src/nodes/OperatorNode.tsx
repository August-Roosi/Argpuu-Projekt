import { type NodeProps, Handle, Position } from '@xyflow/react';
import { type AppState } from './types'; 
import { type OperatorNodes } from './types';
import { TbBinaryTree } from 'react-icons/tb';
import { BsNodePlus, BsNodeMinus } from 'react-icons/bs';
import useArgumentStore from '../stores/ArgumentStore';
import useModalStore from '../stores/ModalStore';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { TbCircuitSwitchClosed } from "react-icons/tb";



export function OperatorNode( node_state: NodeProps<OperatorNodes>) {
    const {id, data} = node_state
    const {stance, argument_ids} = data


    const switchStance = useArgumentStore((state: AppState) => state.switchStance);
    const createArgument = useModalStore((state: any) => state.openModal);

        const onCreate = createArgument;

        const onSwitchStance = useCallback(async () => {
            const result = await switchStance(id);
            if (result[0] === 0) {
                toast.error(result[1]);
            } else {
                toast.success(result[1]);
            }
        }, [switchStance, id]);
    
    
    return (
        <div
            className={`rounded-lg
                ${stance === 'for' ? 'bg-green-300' :
                stance === 'against' ? 'bg-red-300' :
                                        'bg-gray-200'
                }`}
            style={{
                width: `${argument_ids.length * 11}rem`,
                height: "7rem",
            }}
        >
            <div className='flex flex-row '>

                {stance === 'for' ? (
                    <button onClick={onSwitchStance} className='flex w-1/4 h-5 items-center justify-center'>
                        <BsNodePlus className='w-7 h-7 hover:bg-gray-100 rounded-full p-1' />
                    </button>
                ) : stance === 'against' ? (
                    <button onClick={onSwitchStance} className='flex w-1/4 h-5 items-center justify-center'>
                        <BsNodeMinus className='w-7 h-7 hover:bg-gray-100 rounded-full p-1 rotate-180' />
                    </button>
                ) : (
                    <button onClick={onSwitchStance} className='flex w-1/4 h-5 items-center justify-center'>
                        <TbCircuitSwitchClosed className='w-7 h-7 hover:bg-gray-100 rounded-full p-1' />
                    </button>
                )}

                <button className='px-1' onClick={() => onCreate(true, id)}>
                    <TbBinaryTree className='w-6 h-6' />
                </button>
            </div>
            <Handle type="target" className='invisible' position={Position.Top} id="target" />
            <Handle type="source" className='invisible' position={Position.Bottom} id="source" />




        </div>

    );
}
