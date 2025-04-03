import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Edge } from '@xyflow/react';
import { type AppNode, type AppState, type ArgumentNode } from './nodes/types';
import { getCSRFToken } from './utils/getCSRFToken';

function isTextUpdaterNode(node: AppNode): node is ArgumentNode {
  return node.type === 'text-updater';
}


const useStore = create<AppState>((set, get) => ({
  nodes: [],
  edges: [],




  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });},


  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });},

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });},
    
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
        if (node.id === nodeId && isTextUpdaterNode(node)) {
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
  
  getMap: async (argumentMapId: string) => {
    const csrfToken = getCSRFToken();

    const fetchData = async (endpoint: string) => {
        const response = await fetch(endpoint, {
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
        const argumentNodes = await fetchData(`/api/arguments/?argument_map=${argumentMapId}`);

        if (argumentNodes.length === 0) {
            console.warn("No arguments found for this map.");
            return;
        }

        const argumentIds = argumentNodes.map((node: any) => node.id).join(',');

        const argumentEdges = await fetchData(`/api/connections/?arguments=${argumentIds}`);

        const nodes: ArgumentNode[] = argumentNodes.map((node: any) => ({
            ...node,
            type: 'argument',
        }));
        const edges: Edge[] = argumentEdges.map((edge: any) => ({
            id: `${edge.id}`,
            source: `${edge.input_argument}`,
            target: `${edge.output_argument}`,
            data: { operator: edge.operator, stance: edge.stance },
        }));

        set({
            nodes: [...get().nodes, ...nodes],
            edges: [...get().edges, ...edges],
        });

    } catch (error) {
        console.error('Error fetching argument map:', error);
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
