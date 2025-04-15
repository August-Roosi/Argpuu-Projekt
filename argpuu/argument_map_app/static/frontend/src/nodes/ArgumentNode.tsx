import { useCallback, useState , useEffect} from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type ArgumentNode, type AppState } from './types';
import useArgumentStore from '../stores/ArgumentStore';
import { IoMdAdd } from "react-icons/io";
import useModalStore from '../stores/ModalStore';


export function ArgumentNode(node_state: NodeProps<ArgumentNode>) {
    const { id, data } = node_state;
    const { isTopic } = data;

    const content: string = useArgumentStore((state: AppState) => {
        const node = state.nodes.find((node) => node.id === id);
        return node && 'content' in node.data ? node.data.content as string : "";
    });

    const updateNodeText = useArgumentStore((state: AppState) => state.updateNodeText);
    const deleteNode = useArgumentStore((state: AppState) => state.deleteNode);
    
    const [sisendTekst, setSisendTekst] = useState(content);
    const [isEditable, setIsEditable] = useState(false);
    const [isHovered, setIsHovered] = useState(false);


    const onCreate = useModalStore((state) => state.openModal);
    const onRename = useCallback(() => {
        setIsEditable(true);
    }, []);
    const onDelete = useCallback(() => {
        deleteNode(id);
        console.log("Node deleted:", id);
    }, [deleteNode, id]);

    const onBlur = useCallback(() => {
        setIsEditable(false);
        updateNodeText(id, sisendTekst);
    }, [updateNodeText, id, sisendTekst]);

    const onKeyDown = useCallback(
        (evt: React.KeyboardEvent<HTMLInputElement>) => {
            if (evt.key === "Enter") {
                updateNodeText(id, sisendTekst); 
                setIsEditable(false);
                evt.preventDefault(); 
            }
        },
        [updateNodeText, id, sisendTekst]
    );

    const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        setSisendTekst(evt.target.value);
    }, []);

    useEffect(() => {
        // If any specific logic or fetch is needed, you can handle it here.
    }, [id]);

    return (
        <div
            className="text-updater-node relative react-flow__node-default flex flex-col rounded-md! shadow-lg bg-gray-100 text-gray-800 shadow-gray-800" 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >   

            <div className='flex flex-row gap-x-2 justify-end'>
                <button className='bg-yellow-400 rounded-xl w-2 h-2' onClick={onRename}></button>
                <button className='bg-green-400 rounded-xl w-2 h-2' onClick={() => onCreate(id)}>
                    <IoMdAdd className='hover:visible invisible text-[0.5rem]'/>
                </button>
                <button className='bg-red-400 rounded-xl w-2 h-2' onClick={onDelete}></button>
            </div>

            <div className=''>
                {isEditable ? (
                    <input
                        id="text"
                        name="text"
                        value={sisendTekst}
                        onChange={onChange}
                        onKeyDown={onKeyDown}                        
                        onBlur={onBlur}
                        className="nodrag"
                        autoFocus
                        size={Math.max(content.length, 10)}
                    />
                ) : (
                    <label htmlFor="text">
                        {content || "Double-click to edit"}
                    </label>
                )}

  
            </div>


            <Handle type="target" className='invisible' position={Position.Top} id="target"/>

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
                    <p><strong>Juur:</strong> {isTopic ? "true" : "false"}</p>
                </div>
            )}
        </div>
    );
}
