import { Edge } from '@xyflow/react';
import dagre from 'dagre';
import { AppNode } from '../nodes/types';

export const applyDagreLayout = (nodes: AppNode[], edges: Edge[]): AppNode[] => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        ranksep: 100,
        nodesep: 30,
    });
    g.setDefaultEdgeLabel(() => ({}));

    const layoutNodes = nodes.filter(
        (node) => node.type === 'argument-node' || node.type === 'operator-node'
    );
    const layoutNodeIds = new Set(layoutNodes.map((n) => n.id));

    layoutNodes.forEach((node) => {
        const width = 300;
        const height = 60;
        g.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        if (layoutNodeIds.has(edge.target)) {
            
            const groupContainingTarget = nodes.find(
                (node: any) =>
                    node.type === 'operator-node' &&
                    Array.isArray(node.data.argument_ids) &&
                    node.data.argument_ids.includes(edge.source)
            );

            const actualSource = groupContainingTarget?.id ?? edge.source;
            if (layoutNodeIds.has(actualSource)) {
                g.setEdge(actualSource, edge.target);
            }
        }
    });

    dagre.layout(g);

    const positionedNodes = nodes.map((node) => {
        if (layoutNodeIds.has(node.id)) {
            const dagreNode = g.node(node.id);
            if (dagreNode) {
                return {
                    ...node,
                    position: {
                        x: dagreNode.x,
                        y: dagreNode.y,
                    },
                };
            }
        }
        return node;
    });

    return centerChildrenInGroup(positionedNodes);
};

const centerChildrenInGroup = (nodes: AppNode[]): AppNode[] => {
    const updatedNodes = [...nodes];
    const groupNodes = nodes.filter(node => node.type === "operator-node");

    for (const group of groupNodes) {
        const argumentIds = Array.isArray((group.data as { argument_ids: string[] }).argument_ids)
            ? (group.data as { argument_ids: string[] }).argument_ids
            : [];
        const childNodes = updatedNodes.filter(n => argumentIds.includes(n.id));


        const spacing = 270;

        childNodes.forEach((child, index) => {
            child.position = {
                x: 10 + index * spacing, 
                y: 20,
            };
        });
    }

    return updatedNodes;
};
