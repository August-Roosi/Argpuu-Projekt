import {
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
    type OnConnectEnd,
    type OnConnectStart,
    type BuiltInNode
} from '@xyflow/react';
import type { NodeTypes } from '@xyflow/react';

import { PositionLoggerNode } from './PositionLoggerNode';
import { ArgumentNode } from './ArgumentNode';


export type PositionLoggerNode = Node<{ label: string }, 'position-logger'>;
export type ArgumentNode = Node<{ content: string, stance: 'for'|'against'|'undefined',  is_root: boolean, argument_map: string[],  }, 'argument-node'>;



export type AppNode = Node | BuiltInNode | ArgumentNode;
export type AppState = {
    argumentMapId: string;
    nodes: ArgumentNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<ArgumentNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onConnectEnd: OnConnectEnd;
    onConnectStart: OnConnectStart;
    setNodes: (nodes: ArgumentNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    deleteNode: (nodeId: string) => Promise<[0 | 1, string]>;
    updateNodeContent: (nodeId: string, tekst: string) => Promise<[0 | 1, string]>;
    createArgument: (content: string, actionGroupId: string) => Promise<ArgumentNode | null>;
    connectArguments: (sourceId: string, targetId: string, actionGroupId?: string ) => Promise<Edge | null>;
    createArgumentWithConnection: (parentNodeId: string, content: string) => Promise<boolean>;
    getArguments: (id?: string) => Promise<ArgumentNode[]>;
    getMap: (id: string) => void;
    switchStance: (nodeId: string) => Promise<[0 | 1, string]>;
    undo: () => Promise<[0 | 1, string]>;
    reloadMap: () => void;

};



export const nodeTypes = {
    'position-logger': PositionLoggerNode,
    'argument-node': ArgumentNode,
} satisfies NodeTypes;

