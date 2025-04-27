import { useCallback, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type ArgumentNode, type AppState } from './types';
import useArgumentStore from '../stores/ArgumentStore';
import useModalStore from '../stores/ModalStore';
import ResizeTextArea from '../components/ResizeTextArea';
import toast from 'react-hot-toast';
import { BsNodePlus, BsNodeMinus } from 'react-icons/bs';
import { TbCircuitSwitchClosed } from "react-icons/tb";
import { MdDeleteOutline } from "react-icons/md";
import { TbBinaryTree } from 'react-icons/tb';

export function ArgumentNode(node_state: NodeProps<ArgumentNode>) {
    const { id, data } = node_state;
    const { is_root, stance } = data;

    const content: string = useArgumentStore((state: AppState) => {
        const node = state.nodes.find((node) => node.id === id);
        return node && 'content' in node.data ? node.data.content as string : "";
    });

    const updateNodeContent = useArgumentStore((state: AppState) => state.updateNodeContent);
    const deleteNode = useArgumentStore((state: AppState) => state.deleteNode);
    const switchStance = useArgumentStore((state: AppState) => state.switchStance);
    const createArgument = useModalStore((state) => state.openModal);


    const [sisendTekst, setSisendTekst] = useState(content);
    const [isEditable, setIsEditable] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);

    const onCreate = createArgument;
    const onRename = useCallback(() => {
        setIsEditable(true);
    }, []);
    const onClick = useCallback(() => {
        setIsFlashing(true);
    }, []);
    const onDelete = useCallback(async () => {
        const result = await deleteNode(id);
        if (result[0] === 0) {
            toast.error(result[1]);
        } else {
            toast.success(result[1]);
        }
    }, [deleteNode, id]);

    const onBlur = useCallback(async () => {
        setIsEditable(false);
        if (sisendTekst === content) {
            return;
        }
        const result = await updateNodeContent(id, sisendTekst);
        if (result[0] === 0) {
            toast.error(result[1]);
        } else {
            toast.success(result[1]);
        }
    }, [updateNodeContent, id, sisendTekst]);

    const onKeyDown = useCallback(async (evt: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (evt.key === "Enter") {
            setIsEditable(false);
            evt.preventDefault();
            if (sisendTekst === content) {
                return;
            }
            const result = await updateNodeContent(id, sisendTekst);
            if (result[0] === 0) {
                toast.error(result[1]);
            } else {
                toast.success(result[1]);
            }

        }
    },
        [updateNodeContent, id, sisendTekst]
    );

    const onChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSisendTekst(evt.target.value);
    }, []);

    const onSwitchStance = useCallback(async () => {
        const result = await switchStance(id);
        if (result[0] === 0) {
            toast.error(result[1]);
        } else {
            toast.success(result[1]);
        }
    }, [switchStance, id]);


    useEffect(() => {
        if (isFlashing) {
            const timer = setTimeout(() => setIsFlashing(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isFlashing]);

    return (
        <div
            className={`text-updater-node shadow-md  m-0 p-0 border-none relative react-flow__node-default flex flex-col gap-1 rounded-none bg-gray-100 text-gray-800 shadow-gray-600 min-w-64 w-fit max-w-64 
                ${isEditable ? "size-max p-2": ""}  transition-colors duration-200 
                ${isFlashing ? 'animate-radiate bg-yellow-300' : ''} 
                ${stance === 'for' ? 'bg-green-300' :
                    stance === 'against' ? 'bg-red-300' :
                        'bg-gray-200'
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >

            {isEditable ? (
                <ResizeTextArea
                    placeholder="Sisesta tekst"
                    id="text"
                    name="text"
                    value={sisendTekst}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onBlur={onBlur}
                    className="nodrag p-4 h-fit overflow-y-none"
                    autoFocus
                />
            ) : (
                <div className='flex flex-col '>
                    <div className={`flex ${!is_root ? "justify-between":"justify-end"} items-center bg-white p-1 shadow-md rounded-t-none`}>
                        {!is_root &&
                        <div className='w-full flex'>
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

                        </div>}
                        <div className={`flex flex-row justify-end `}>
                            {/* <button className='px-1' onClick={onRename}>
                                <div className='bg-yellow-400 rounded-xl w-3 h-3 hover:bg-yellow-200 focus:bg-yellow-600'></div>
                            </button> */}
                            {/* <button className='px-1' onClick={() => onCreate(id)}>
                                <div className='bg-green-400 rounded-xl w-3 h-3 hover:bg-green-200 focus:bg-green-600'></div>
                            </button>
                            {!isTopic &&
                                <button className='px-1' onClick={onDelete}>
                                    <div className='bg-red-400 rounded-xl w-3 h-3 hover:bg-red-200 focus:bg-red-600'></div>
                                </button>} */}
                            <button className='px-1' onClick={() => onCreate(id)}>
                                <TbBinaryTree className='w-6 h-6' />
                            </button>
                            {!is_root &&
                            <button className='px-1' onClick={onDelete}>
                                <MdDeleteOutline className='w-6 h-6'/>
                            </button>}
                            
                        </div>

                    </div>
                    <h1 onDoubleClick={onRename} onClick={onClick} className={`hover:cursor-pointer text-wrap break-words hyphens-auto p-4`} lang='et'>
                        {content || "Redigeerimiseks tee topeltklõps"}
                    </h1>


                </div>
            )}


            <Handle type="target" className='invisible' position={Position.Top} id="target" />

            <div className="relative">
                <Handle
                    type="source"
                    className='p-2 invisible rounded-lg bg-green-400 border-gray-800 hover:bg-green-200'
                    position={Position.Bottom}
                    id="source"
                />
            </div>



            {isHovered && (
                <div className="absolute top-0 left-full ml-2 p-2 bg-gray-800 text-white rounded-md shadow-lg flex flex-wrap w-40 gap-x-2">
                    <p><strong>Tipu ID:</strong> {id}</p>
                    <p><strong>Tekst:</strong> {content || "Puudub"}</p>
                    <p><strong>Juur:</strong> {is_root ? "true" : "false"}</p>
                </div>
            )}
        </div>
    );
}
