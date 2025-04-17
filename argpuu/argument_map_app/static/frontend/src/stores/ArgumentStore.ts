import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Edge } from '@xyflow/react';
import { type AppState, type ArgumentNode } from '../nodes/types';
import { getCSRFToken } from '../utils/getCSRFToken';
import { applyDagreLayout } from '../utils/dagreLayout';

const useArgumentStore = create<AppState>((set, get) => ({
  argumentMapId: "",
  nodes: [],
  edges: [],




  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
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

  onConnectEnd: () => { },
  onConnectStart: () => { },
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },

  updateNodeText: (nodeId: string, newText: string) => {
    console.log(newText);
    console.log("Updating node with id:", nodeId);
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, content: newText } };
        }
        return node;
      }),
    });

    const updateNodeRequest = async () => {
      const csrfToken = getCSRFToken();
      const response = await fetch(`/api/arguments/${nodeId}/`, {
        method: 'PATCH',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        }),
        body: JSON.stringify({
          data: {
            content: newText,
          },
        }),
      });

      if (!response.ok) {
        console.error(`Failed to update node ${nodeId}:`, response.status);
      } else {
        console.log(`Node ${nodeId} updated successfully.`);
      }
    };

    updateNodeRequest();
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
      const argumentEdges = await fetchData(`/api/connections/?arguments=${argumentIds}&argument_map=${argumentMapId}`);

      const nodes: ArgumentNode[] = argumentNodes.map((node: any) => ({
        ...node,
        type: 'argument-node',
      }));
      const edges: Edge[] = argumentEdges.map((edge: any) => ({
        id: `${edge.id}`,
        source: `${edge.source}`,
        target: `${edge.target}`,
        data: { operator: edge.operator, stance: edge.stance },
      }));

      const positionedNodes = applyDagreLayout(nodes, edges);

      set({
        argumentMapId: argumentMapId,
        nodes: [...get().nodes, ...positionedNodes],
        edges: [...get().edges, ...edges],
      });

    } catch (error) {
      console.error('Error fetching argument map:', error);
    }
  },



  createArgumentWithConnection: async (parentArgumentId: string, content: string): Promise<boolean> => {
    console.log("Parent node ID:", parentArgumentId);
    
    const newNode = await get().createArgument(content);
    if (!newNode) return false;
  
    const newEdge = await get().connectArguments(parentArgumentId, newNode.id);
    if (!newEdge) return false;
  
    const positionedNodes = applyDagreLayout(
      [...get().nodes, newNode],
      [...get().edges, newEdge]
    );
  
    set({
      nodes: positionedNodes,
      edges: [...get().edges, newEdge],
    });
  
    console.log("Node and edge created successfully.");
    return true;
  },
  

  createArgument: async (content: string): Promise<ArgumentNode | null> => {
    const csrfToken = getCSRFToken();
  
    try {
      const nodeResponse = await fetch('/api/arguments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({
          argument_map: [get().argumentMapId],
          position: { x: 250, y: 250 },
          data: { content },
        }),
      });
  
      if (!nodeResponse.ok) {
        throw new Error(`Node creation failed: ${nodeResponse.status}`);
      }
  
      const nodeData = await nodeResponse.json();
  
      const newNode: ArgumentNode = {
        ...nodeData,
        type: "argument-node",
        data: {
          content: content,
          isTopic: false,
        },
      };
  
      return newNode;
    } catch (err) {
      console.error("Error creating node:", err);
      return null;
    }
  },

  connectArguments: async (sourceId: string, targetId: string) => {
    const csrfToken = getCSRFToken();
    const argumentMapId = get().argumentMapId;
  
    const ensureNodeInMap = async (nodeId: string) => {
      const nodeExists = get().nodes.some((node) => node.id === nodeId);

      if (!nodeExists) {
        try {
          const [fetchedNode] = await get().getArguments(nodeId);
      
          if (!fetchedNode) {
            console.warn(`Node ${nodeId} not found in backend`);
            return;
          }
      
          const updatedMapIds = [
            ...(fetchedNode.data.argument_map || []),
            argumentMapId,
          ];
      
          const csrfToken = getCSRFToken();
          const response = await fetch(`/api/arguments/${nodeId}/`, {
            method: 'PATCH',
            headers: new Headers({
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken || '',
            }),
            body: JSON.stringify({
              argument_map: updatedMapIds,
            }),
          });
      
          if (!response.ok) {
            console.warn(`Could not append map ID to node ${nodeId}:`, response.status);
          } else {
            console.log(`Map ID appended to node ${nodeId} successfully.`);
          }
        } catch (err) {
          console.error(`Failed to patch node ${nodeId}:`, err);
        }
      }
      
    };
  
    await ensureNodeInMap(sourceId);
    await ensureNodeInMap(targetId);
    console.log("Argument map ID:!", argumentMapId);
    try {
      const edgeResponse = await fetch('/api/connections/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({
          argument_map: argumentMapId,
          source: sourceId,
          target: targetId,
        }),
      });
  
      if (!edgeResponse.ok) {
        throw new Error(`Edge creation failed: ${edgeResponse.status}`);
      }
  
      const newEdge = await edgeResponse.json();
      return newEdge;
    } catch (err) {
      console.error("Error creating edge:", err);
      return null;
    }
  },
  


  getArguments: async (id?: string): Promise<ArgumentNode[]> => {
    const csrfToken = getCSRFToken();

    const url = id ? `/api/arguments/${id}` : `/api/arguments/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch argument(s): ${response.status}`);
      }

      const data = await response.json();

      const argumentArray = Array.isArray(data) ? data : [data];

      const nodes: ArgumentNode[] = argumentArray.map((node: any) => ({
        ...node,
        type: 'argument-node',
      }));

      return nodes;
    } catch (error) {
      console.error("Error fetching argument(s):", error);
      return [];
    }
  }




}));

export default useArgumentStore;
