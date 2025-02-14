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
export type ArgumentNode = Node<{ content: string, isTopic: boolean }, 'text-updater'>;



export type AppNode = Node | BuiltInNode | ArgumentNode;

export type AppState = {
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onConnectEnd: OnConnectEnd;
    onConnectStart: OnConnectStart;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    deleteNode: (nodeId: string) => void;
    updateNodeText: (nodeId: string, tekst: string) => void;
    assignRootseisukoht: (nodeId: string) => void;
    createNode: (tekst: string, juur: boolean) => void;
};




export const nodeTypes = {
    'position-logger': PositionLoggerNode,
    'argument': ArgumentNode,
} satisfies NodeTypes;

