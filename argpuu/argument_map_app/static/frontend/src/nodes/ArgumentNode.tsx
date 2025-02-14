import { useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type ArgumentNode, type AppState } from './types';
import useStore from '../store';

export function ArgumentNode(node_state: NodeProps<ArgumentNode>) {
    const { id , data } = node_state;
    const { isTopic} = data

    const content: string = useStore((state: AppState) => {
        const node = state.nodes.find((node) => node.id === id);
        return node && 'content' in node.data ? node.data.content as string : "";
    });
    const updateNodeText = useStore((state: AppState) => state.updateNodeText);
    const deleteNode = useStore((state: AppState) => state.deleteNode);

    // Track local state for the input text
    const [sisendTekst, setSisendTekst] = useState(content);
    const [isEditable, setIsEditable] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isHovered, setIsHovered] = useState(false); // Track hover state

    const onDoubleClick = useCallback(() => {
        setShowActions(true); // Show action buttons on double-click
    }, []);

    const onRename = useCallback(() => {
        setIsEditable(true); // Enable editing for renaming
        setShowActions(false); // Hide action buttons
    }, []);

    const onCancel = useCallback(() => {
        setShowActions(false); // Hide action buttons without making changes
    }, []);

    const onDelete = useCallback(() => {
        deleteNode(id); // Delete node when the user clicks "Delete"
        console.log("Node deleted:", id);
    }, [deleteNode, id]);

    const onBlur = useCallback(() => {
        setIsEditable(false); // Disable editing when input loses focus
        setShowActions(false);
        updateNodeText(id, sisendTekst); // Save the new tekst to the store
    }, [updateNodeText, id, sisendTekst]);

    const onKeyDown = useCallback(
        (evt: React.KeyboardEvent<HTMLInputElement>) => {
            if (evt.key === "Enter") {
                setIsEditable(false); // Exit editing mode on Enter
                updateNodeText(id, sisendTekst); // Save the new tekst to the store when pressing Enter
                console.log(sisendTekst);
            }
        },
        [updateNodeText, id, sisendTekst]
    );

    const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        setSisendTekst(evt.target.value); // Update the tekst in the local state as the user types
    }, []);

    return (
        <div
            className="text-updater-node react-flow__node-default"
            onMouseEnter={() => setIsHovered(true)}  // Show popup on hover
            onMouseLeave={() => setIsHovered(false)} // Hide popup when mouse leaves
        >
            <div>
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
                    <label htmlFor="text" onDoubleClick={onDoubleClick}>
                        {content || "Double-click to edit"}
                    </label>
                )}

                {showActions && !isEditable && (
                    <div onBlur={onBlur} className="actions">
                        <button onClick={onRename} className="nodrag">Rename</button>
                        <button onClick={onCancel} className="nodrag">Cancel</button>
                        <button onClick={onDelete} className="nodrag">Delete</button>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} id="a" />

            {/* Popup debug box */}
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
