import { type NodeProps, Handle, Position } from '@xyflow/react';
import { type AppState } from './types';
import { type OperatorNodes } from './types';
import { BsNodePlus, BsNodeMinus } from 'react-icons/bs';
import useArgumentStore from '../stores/ArgumentStore';
import useModalStore from '../stores/ModalStore';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { TbCircuitSwitchClosed } from "react-icons/tb";
import { IoMdAddCircleOutline } from "react-icons/io";


export function OperatorNode(node_state: NodeProps<OperatorNodes>) {
    const { id, data } = node_state
    const { stance, argument_ids } = data


    const nodes = useArgumentStore((state: AppState) => state.nodes);

    const maxContentLength = nodes
        .filter((node) => argument_ids.includes(node.id))
        .reduce((max, node) => {
            if ('content' in node.data && typeof node.data.content === 'string') {
                return Math.max(max, node.data.content.length);
            }
            return max;
        }, 0);



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


    const charsPerLine = 35;
    const lineHeightRem = 1.65;
    const baseHeightRem = 6;

    const lines = Math.ceil(maxContentLength / charsPerLine);

    return (
        <div
            className={`flex flex-col h-full rounded-lg justify-items-end shadow-md
                ${stance === 'for' ? 'bg-green-300/40' :
                    stance === 'against' ? 'bg-red-300/40' :
                        'bg-gray-200/40'
                }`}
            style={{
                width: `${(argument_ids.length * 10.6) + 1.8}em`,
                height: `${baseHeightRem + lines * lineHeightRem}rem `,
            }}
        >
            <div className='flex flex-row-reverse h-full w-full pl-2'>

                <button className='px-1 h-full hover:bg-white/30 basis-2 tr-rounded-lg! br-rounded-lg!' onClick={() => onCreate(true, id)}>
                    <div className='flex flex-row justify-center'>
                        {/* <VscGroupByRefType className='w-4 h-4 rotate-90' /> */}
                        <IoMdAddCircleOutline className='w-4 h-4 rotate-90' />

                    </div>


                </button>
                <div className='flex flex-row basis-[97%] justify-start'>

                    {stance === 'for' ? (
                        <button onClick={onSwitchStance} className='flex w-1/4 h-5 items-center justify-start'>
                            <BsNodePlus className='w-7 h-7 hover:bg-gray-100 rounded-full p-1' />
                        </button>
                    ) : stance === 'against' ? (
                        <button onClick={onSwitchStance} className='flex w-1/4 h-5 items-center justify-start'>
                            <BsNodeMinus className='w-7 h-7 hover:bg-gray-100 rounded-full p-1 rotate-180' />
                        </button>
                    ) : (
                        <button onClick={onSwitchStance} className='flex w-1/4 h-5 items-center justify-start'>
                            <TbCircuitSwitchClosed className='w-7 h-7 hover:bg-gray-100 rounded-full p-1' />
                        </button>
                    )}

                </div>


            </div>


            <Handle type="target" className='invisible' position={Position.Top} id="target" />
            <Handle type="source" className='invisible' position={Position.Bottom} id="source" />




        </div>

    );
}
