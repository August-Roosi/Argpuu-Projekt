import { useCallback, useState, useEffect } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type ArgumentNodes, type AppState } from './types';
import useArgumentStore from '../stores/ArgumentStore';
import useModalStore from '../stores/ModalStore';
import ResizeTextArea from '../components/ResizeTextArea';
import toast from 'react-hot-toast';
import { PiTreeStructureDuotone } from "react-icons/pi";
import { AiTwotoneDelete } from "react-icons/ai";

export function ArgumentNode(node_state: NodeProps<ArgumentNodes>) {
    const { id, data } = node_state;
    const { is_root } = data;

    const content: string = useArgumentStore((state: AppState) => {
        const node = state.nodes.find((node) => node.id === id);
        return node && 'content' in node.data ? node.data.content as string : "";
    });

    const updateNodeContent = useArgumentStore((state: AppState) => state.updateNodeContent);
    const deleteNode = useArgumentStore((state: AppState) => state.deleteNode);
    const createArgument = useModalStore((state) => state.openModal);


    const [sisendTekst, setSisendTekst] = useState(content);
    const [isEditable, setIsEditable] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);


    const onCreate = createArgument;
    const onRename = useCallback(() => {
        console.log("teen")
        setIsEditable(true);
    }, []);
    const onClick = useCallback(() => {

        setIsFlashing(true);
        setIsEditable(true)
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



    useEffect(() => {
        if (isFlashing) {
            const timer = setTimeout(() => setIsFlashing(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isFlashing]);

    return (
        <div
            className={`text-updater-node shadow-sm p-2  p-x-4 m-0 border-none relative react-flow__node-default flex flex-col gap-1 rounded-none bg-gray-100 text-gray-800 shadow-gray-600 min-w-40 w-fit max-w-40 min-h-20 
                ${isEditable ? "size-max p-2" : ""}  transition-colors duration-200 
                ${isFlashing ? 'animate-radiate bg-yellow-300' : ''} 
                `}
        >


            <div className='flex flex-col '>
                <div className={`flex ${!is_root ? "justify-between" : "justify-start"} items-center rounded-t-none`}>

                    <div className={`flex flex-row justify-end `}>
                        <button className='px-0' onClick={() => onCreate(false, id)}>
                            <PiTreeStructureDuotone className='w-5 h-5 rotate-90' />
                        </button>
                        {!is_root &&
                            <button className='px-0' onClick={onDelete}>
                                <AiTwotoneDelete className='w-5 h-5' />
                            </button>}

                    </div>

                </div>

                {isEditable ? (
                    <ResizeTextArea
                        placeholder="Sisesta tekst"
                        id="text"
                        name="text"
                        value={sisendTekst}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        onBlur={onBlur}
                        className="nodrag p-2 h-fit overflow-y-none min-h-12"
                        autoFocus
                    />
                ) : (
                    <div className="flex items-center justify-center min-h-12 "> 
                        <h1
                            onDoubleClick={onRename}
                            onClick={onClick}
                            className="hover:cursor-pointer text-wrap break-words font-medium hyphens-auto pt-2"
                            lang="et"
                        >
                            {content || "Redigeerimiseks tee topeltklõps"}
                        </h1>
                    </div>

                )}

            </div>


            <Handle type="target" className='invisible' position={Position.Top} id="target" />

            <div className="relative">
                <Handle
                    type="source"
                    className='p-2 invisible rounded-lg bg-green-400 border-gray-800 hover:bg-green-200'
                    position={Position.Bottom}
                    id="source"
                />
            </div>

        </div>
    );
}
