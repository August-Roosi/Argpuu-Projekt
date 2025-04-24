import { Edge } from '@xyflow/react';
import dagre from 'dagre';
import { ArgumentNode } from '../nodes/types'; 

export const applyDagreLayout = (nodes: ArgumentNode[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        ranksep: 100, // vertical
        nodesep: 30, // horizontal
    });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
        g.setNode(node.id, { width: 300, height: Math.max(node.data.content.length,40) });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const positionedNodes = nodes.map((node) => {
        const nodePosition = g.node(node.id);
        return {
            ...node,
            position: {
                x: nodePosition.x,
                y: nodePosition.y,
            },
        };
    });

    return positionedNodes;
};
