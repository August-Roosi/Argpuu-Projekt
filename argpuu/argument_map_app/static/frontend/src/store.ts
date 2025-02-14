import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, type Edge } from '@xyflow/react';
import { type AppNode, type AppState, type ArgumentNode } from './nodes/types';
import { getCSRFToken } from './utils/getCSRFToken';

// Check if a node is of type 'text-updater'
function isColorChooserNode(node: AppNode): node is ArgumentNode {
  return node.type === 'text-updater';
}


// Function to assign seisukohts in an alternating manner based on node sügavus
function assignseisukohtsAlternating(
  nodes: AppNode[],
  edges: Edge[],
  rootNodeId: string,
  currentseisukoht: 'poolt' | 'vastu'
): AppNode[] {
  let updatedNodes = [...nodes];
  const queue = [{ nodeId: rootNodeId, seisukoht: currentseisukoht, sügavus: 0 }]; // sügavus level for each node
  const visited = new Set(); // To avoid re-processing the same node

  // Breadth-first search (BFS) to propagate the seisukoht alternately through the graph
  while (queue.length > 0) {
    const { nodeId, seisukoht, sügavus } = queue.shift()!;
    if (visited.has(nodeId)) continue;

    visited.add(nodeId);

    // Update the current node's seisukoht
    updatedNodes = updatedNodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, seisukoht } };
      }
      return node;
    });

    // Get child nodes (targets of edges where the node is the source)
    const childEdges = edges.filter((edge) => edge.source === nodeId);
    const nextseisukoht = sügavus % 2 === 0 ? (seisukoht === 'poolt' ? 'vastu' : 'poolt') : seisukoht;

    // Add the child nodes to the queue with the updated seisukoht and incremented sügavus
    childEdges.forEach((edge) => {
      if (!visited.has(edge.target)) {
        queue.push({ nodeId: edge.target, seisukoht: nextseisukoht, sügavus: sügavus + 1 });
      }
    });
  }

  return updatedNodes;
}

// Zustand store
const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],


  assignRootseisukoht: (rootNodeId: string) => {
    const { nodes, edges } = get();
    const updatedNodes = assignseisukohtsAlternating(nodes, edges, rootNodeId, 'poolt');
    set({ nodes: updatedNodes });
  },


  onNodesChange: (changes) => {
    //console.log(get().nodes)
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    // Call assignRootseisukoht every time nodes change
    const updatedNodes = get().nodes;
    const rootNode = updatedNodes.find((node) => {
      return node.data && 'juur' in node.data && node.data.juur;
    });
    if (rootNode) {
      console.log(rootNode.id)
      // Assuming root node exists and has a 'root' property
      get().assignRootseisukoht(rootNode.id);  // Call function to assign stances
    }
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  onConnectEnd: () => {},
  onConnectStart: () => {},
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },

  updateNodeText: (nodeId: string, newText: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId && isColorChooserNode(node)) {
          return { ...node, data: { ...node.data, tekst: newText } };
        }
        return node;
      }),
    });
  },
  deleteNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
    });
  },
  

  createNode: async (tekst: string, juur: boolean = false) => {
    console.log("Creating node with tekst:", tekst);


    const saveFlowData = async () => {
      const csrfToken = getCSRFToken(); // CSRF token method in React
      const response = await fetch('/api/arguments/', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        }),
        body: JSON.stringify({
          id: "",
          position: { x: 250, y: 250 },
          data: {
          content: tekst,
          isTopic: juur,
          }}),
      });
  
      // Ensure you return the JSON response if the request is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json(); // Parse and return JSON from the response
    };


    const response = await saveFlowData();
    response["type"] = "argument"
    const newNode: ArgumentNode = response;
    console.log("Node made successfully:", newNode);

    set({
      nodes: [...get().nodes, newNode], // Add the new node
    });
  },
}));

export default useStore;
