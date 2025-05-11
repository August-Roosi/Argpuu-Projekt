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

import { ArgumentNode } from './ArgumentNode';
import { OperatorNode } from './OperatorNode';

export type ArgumentNodes = Node<{ content: string; is_root: boolean; argument_map: string[] }, 'argument-node'>;
export type OperatorNodes = Node<{ argument_ids: string[]; operator_type: 'AND' | 'OR'; stance: 'for' | 'against' | 'undefined';}, 'operator-node'>;

export type AppNode = Node | BuiltInNode | OperatorNodes | ArgumentNodes ;
export type AppState = {
    argumentMapId: string;
    isArgumentMapReadOnly: boolean;
    nodes: AppNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onConnectEnd: OnConnectEnd;
    onConnectStart: OnConnectStart;
    setNodes: (nodes: AppNode[]) => void;
    setEdges: (edges: Edge[]) => void;
    deleteNode: (nodeId: string) => Promise<[0 | 1, string]>;
    updateNodeContent: (nodeId: string, tekst: string) => Promise<[0 | 1, string]>;
    createArgument: (content: string, actionGroupId: string) => Promise<AppNode | null>;
    createOperator: (actionGroupId: string, argumentId: string) => Promise<AppNode | null>;
    connectArguments: (sourceId: string, targetId: string, actionGroupId?: string ) => Promise<Edge | null>;
    createArgumentWithConnection: (parentNodeId: string, {content, newArgumentId}:{content?: string, newArgumentId?: string}) => Promise<boolean>;
    createSiblingArgument: (operatorId: string, {content, newArgumentId}:{content?: string, newArgumentId?: string}) => Promise<boolean>;
    getArguments: (id?: string) => Promise<ArgumentNodes[]>;
    getMap: (id: string, isArgumentMapReadOnly?:boolean) => void;

    switchStance: (nodeId: string) => Promise<[0 | 1, string]>;
    undo: () => Promise<[0 | 1, string]>;
    reloadMap: () => void;

};



export const nodeTypes = {
    'argument-node': ArgumentNode,
    'operator-node': OperatorNode,
} satisfies NodeTypes;

