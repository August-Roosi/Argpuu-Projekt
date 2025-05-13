import React from 'react';
import ReactDOM from 'react-dom/client';
import {
    ReactFlow,
    Edge,
} from '@xyflow/react';
import './styles/actions.css';
import './styles/index.css';

import { AppNode } from './nodes/types';

const nodes: AppNode[] = [
    {
        id: '1',
        data: { label: 'Kõik lumememmed on valged' },
        position: { x: 0, y: 0 },
        type: 'argument-node',
    },
    {
        id: '4',
        position: { x: 0, y: 100 },
        data: {},
        type: 'operator-node',
    },
        {
        id: '2',
        data: { label: 'Kõik lumi on valge' },
        position: { x: 50, y: 100 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '4',
    },
        {
        id: '3',
        data: { label: 'Kõik lumememmed on lumest' },
        position: { x: 0, y: 100 },
        type: 'argument-node',
        extent: 'parent',
        parentId: '4',
    },

];

const edges: Edge[] = [];

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <div style={{ height: 400 }}>
            <ReactFlow nodes={nodes} edges={edges} />
        </div>
    </React.StrictMode>
);
