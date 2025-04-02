import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { type AppNode, type AppState, type ArgumentNode } from './nodes/types';
import { getCSRFToken } from './utils/getCSRFToken';

// Check if a node is of type 'text-updater'
function isColorChooserNode(node: AppNode): node is ArgumentNode {
  return node.type === 'text-updater';
}




const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],




  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    const updatedNodes = get().nodes;
    const rootNode = updatedNodes.find((node) => {
      return node.data && 'juur' in node.data && node.data.juur;
    });
    if (rootNode) {
      console.log(rootNode.id)
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
    console.log("Deleting node with id:", nodeId);

    const deleteNodeRequest = async () => {
      const csrfToken = getCSRFToken(); 
      const response = await fetch(`/api/arguments/${nodeId}/`, {
        method: 'DELETE',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        console.log(response.status)
      }
    };

    deleteNodeRequest();

    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
    });
  },
  
  getMapNodes: async (argumentMapId: string) => {
    const getMapNodesRequest = async () => {
      const csrfToken = getCSRFToken();
      const response = await fetch(`/api/arguments/?argument_map=${argumentMapId}`, {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    };
  
    try {
      const response = await getMapNodesRequest();
  
      const nodes: ArgumentNode[] = response.map((node: any) => ({
        ...node,
        type: 'argument',
      }));
  
      set({
        nodes: [...get().nodes, ...nodes],
      });
    } catch (error) {
      console.error('Error fetching argument map nodes:', error);
    }
  },
  

  createNode: async (tekst: string, juur: boolean = false) => {
    console.log("Creating node with tekst:", tekst);


    const createNodeRequest = async () => {
      const csrfToken = getCSRFToken(); 
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
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        console.log("Node made successfully");
      }
      return response.json(); 
    };


    const response = await createNodeRequest();
    response["type"] = "argument"
    const newNode: ArgumentNode = response;

    set({
      nodes: [...get().nodes, newNode], // Add the new node
    });
  },
}));

export default useStore;
