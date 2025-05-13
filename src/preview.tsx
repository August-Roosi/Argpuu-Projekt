import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    ReactFlow,
    Edge,
} from '@xyflow/react';
import './styles/actions.css';
import './styles/index.css';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes/types';
import { edgeTypes } from './edges';


import { AppNode } from './nodes/types';

const nodes: AppNode[] = [
    {
        id: '1',
        data: { content: 'Kõik lumememmed on valged' },
        position: { x: 0, y: 0 },
        type: 'argument-node',
    },
    {
        id: '4',
        position: { x: 0, y: 100 },
        data: { label: '' },
        type: 'operator-node',
    },
        {
        id: '2',
        data: { content: 'Kõik lumi on valge' },
        position: { x: 50, y: 100 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '4',
    },
        {
        id: '3',
        data: { content: 'Kõik lumememmed on lumest' },
        position: { x: 0, y: 100 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '4',
    },

];

const edges: Edge[] = [
    { id: '1-4', source: '1', target: '4' }

];

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <div style={{ height: '100%', width: '100%' }}>
            <ReactFlow
            edgeTypes={edgeTypes}
            nodeTypes={nodeTypes}
            
            nodes={nodes}
            edges={edges}
            fitView
            zoomOnScroll={false}  
            panOnScroll={false}      
            draggable={false}


            />
        </div>
        
    </React.StrictMode>
);
