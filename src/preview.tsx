import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    ReactFlow,
    Edge, 
    Background, BackgroundVariant } from '@xyflow/react';
import './styles/actions.css';
import './styles/index.css';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes/types';
import { edgeTypes } from './edges';


import { AppNode } from './nodes/types';

const nodes: AppNode[] = [
    {
        id: '1',
        data: { content: 'Kõik lumememmed on valged', is_root: true, argument_map: []},
        position: { x: 100, y: 0 },
        type: 'argument-node',
        draggable: true,
    },
    {
        id: '4',
        position: { x: 0, y: 200 },
        data: { label: '', argument_ids: [2, 3], operator_type: 'AND', stance: 'for'},
        type: 'operator-node',
        draggable: true,
    },
        {
        id: '2',
        data: { content: 'Kõik lumi on valge', is_root: false, argument_map: []},
        position: { x: 20, y: 10 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '4',
    },
        {
        id: '3',
        data: { content: 'Kõik lumememmed on lumest', is_root: false, argument_map: []},
        position: { x: 190, y: 10 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '4',
    },
    {
        id: '5',
        position: { x: 0, y: 400 },
        data: { label: '', argument_ids: [6], operator_type: 'OR', stance: 'against'},
        type: 'operator-node',
        draggable: true,
    },
        {
        id: '6',
        data: { content: 'Vahel on lumi kollane', is_root: false, argument_map: []},
        position: { x: 20, y: 10 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '5',
    },
];

const edges: Edge[] = [
    { id: '1-4', source: '1', target: '4' },
    { id: '2-5', source: '2', target: '5' }

];



ReactDOM.createRoot(document.getElementById('root-preview')!).render(
    <React.StrictMode>
        <div style={{ height: '100%', width: '100%' }} className='bg-gray-700'>
            <ReactFlow
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "smoothstep" }}
            
            nodes={nodes}
            edges={edges}
            fitView
            zoomOnScroll={false}  
            panOnScroll={false}      
            panOnDrag={false}
            fitViewOptions={{ padding: 0.3 }}


            />
            <Background variant={BackgroundVariant.Dots} />
        </div>
        
    </React.StrictMode>
);
