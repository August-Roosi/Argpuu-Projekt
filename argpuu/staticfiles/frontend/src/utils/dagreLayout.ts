import { Edge as BaseEdge } from '@xyflow/react';

interface Edge extends BaseEdge {
    order?: number;
}
import dagre from 'dagre';
import { AppNode, ArgumentNodes, OperatorNodes } from '../nodes/types';

export const applyDagreLayout = (nodes: AppNode[], edges: Edge[]): AppNode[] => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        ranksep: 100,
        nodesep: 50,
    });
    g.setDefaultEdgeLabel(() => ({}));

    const layoutNodes = nodes.filter(
        (node) => node.type === 'argument-node' || node.type === 'operator-node'
    );
    console.log(layoutNodes, "suva")

    const argumentNodes = nodes.filter(
        (node): node is ArgumentNodes => node.type === 'argument-node'
    );
    const operatorNodes = nodes.filter(
        (node): node is OperatorNodes => node.type === 'operator-node'
    );


    const rootNode = argumentNodes.find(argumentNode => argumentNode.data.is_root);


    if (rootNode?.id) {
        const layoutNodeIds = new Set([...operatorNodes.map((n) => n.id), rootNode.id]);
        g.setNode(rootNode.id, { width: 300, height: 60 });


        operatorNodes.forEach((operatorNode) => {
            const width = 150;
            const height = 60;

            let order = 0;
            const argumentId = edges.find(edge => edge.target == operatorNode.id)?.source
            
            const operatorParent = operatorNodes.find(
                (parent: OperatorNodes) =>
                    parent.data.argument_ids.includes(argumentId ?? '')
            );
            console.log(operatorParent, operatorNode)
            if (operatorParent) {
                order = operatorParent.data.argument_ids.indexOf(argumentId ?? '');
            }
            edges = edges.map(edge => {
                if (edge.target == operatorNode.id) {
                    return {...edge, order}
                } else {
                    return edge 
                }
            })

            const maxContentLength = argumentNodes
            .filter((node) => operatorNode.data.argument_ids.includes(node.id))
            .reduce((max, node) => {
                if ('content' in node.data && typeof node.data.content === 'string') {
                    return Math.max(max, node.data.content.length);
                }
                return max;
            }, 0);
    

            
            const charsPerLine = 35;
            const lines = Math.ceil(maxContentLength / charsPerLine);


            g.setNode(operatorNode.id, { width: (width + (operatorNode.data.argument_ids.length * 150)), height: (height+ (lines*40))}); 
        });


        const edger = (edge: Edge) => {
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
        };
        
        const sortedEdges = edges.slice().sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : Infinity;
            const orderB = b.order !== undefined ? b.order : Infinity;
            return orderA - orderB;
        });
        


        sortedEdges.forEach((edge) => {
            edger(edge)
            
        });
        


        dagre.layout(g);

        const positionedNodes = nodes.map((node) => {
            if (layoutNodeIds.has(node.id)) {
                const dagreNode = g.node(node.id);
                if (dagreNode) {
                    return {
                        ...node,
                        position: {
                            x: dagreNode.x- dagreNode.width / 1.7,
                            y: dagreNode.y,
                        },
                    };
                }
            }
            return node;
        });

        return centerChildrenInGroup(positionedNodes);





    } else {
        console.error("Problem finding root node.")
        return nodes
    }

};


const centerChildrenInGroup = (nodes: AppNode[]): AppNode[] => {
    const updatedNodes = [...nodes];
    const groupNodes = nodes.filter(node => node.type === "operator-node");

    for (const group of groupNodes) {
        const argumentIds = Array.isArray((group.data as { argument_ids: string[] }).argument_ids)
            ? (group.data as { argument_ids: string[] }).argument_ids
            : [];
        const childNodes = updatedNodes.filter(n => argumentIds.includes(n.id));


        const spacing = 169;

        childNodes.forEach((child, index) => {
            child.position = {
                x: 10 + index * spacing, 
                y: 20,
            };
        });
    }

    return updatedNodes;
};
