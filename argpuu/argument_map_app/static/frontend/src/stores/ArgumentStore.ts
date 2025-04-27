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

  updateNodeContent: async (nodeId: string, newText: string): Promise<[0 | 1, string]> => {
    const actionGroupId = crypto.randomUUID();
    console.log("Updating node with id:", nodeId);

    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, content: newText } } : node
      ),
    });

    const csrfToken = getCSRFToken();
    try {
      const response = await fetch(`/api/arguments/${nodeId}/`, {
        method: 'PATCH',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'X-Action-Group-Id': actionGroupId,
          'X-Argument-Map-Id': get().argumentMapId,
        }),
        credentials: 'include',
        body: JSON.stringify({
          data: {
            content: newText,
          },
        }),
      });

      if (!response.ok) {
        return [0, "Argumendi uuendamine ebaõnnestus!"];
      }

      return [1, "Argument edukalt uuendatud!"];
    } catch (err) {
      return [0, "Tekkis ootamatu viga argumendi uuendamisel!"];
    }
  },

  deleteNode: async (nodeId: string): Promise<[0 | 1, string]> => {
    const actionGroupId = crypto.randomUUID();
    const targetEdge = get().edges.find(edge => edge.target === nodeId);
  
    if (!targetEdge) {
      console.error("Target edge not found for node ID:", nodeId);
      return [0, "Tekkis probleem argumendi kustutamisel!"];
    }
  
    const newSourceId = targetEdge.source;
    const affectedEdges = get().edges.filter(edge => edge.source === nodeId);
  
    const csrfToken = getCSRFToken();
  
    try {
      const patchResults = await Promise.all(affectedEdges.map(async (edge) => {
        const response = await fetch(`/api/connections/${edge.id}/`, {
          method: 'PATCH',
          headers: new Headers({
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken || '',
            'X-Action-Group-Id': actionGroupId,
            'X-Argument-Map-Id': get().argumentMapId,

          }),
          credentials: 'include',
          body: JSON.stringify({ 
            source: newSourceId 
          }),
        });
  
        return response.ok;
      }));
  
      if (patchResults.some(success => !success)) {
        console.error("Failed to update some edges:", patchResults);
        return [0, "Tekkis probleem ühenduste uuendamisel!"];
      }
  
      const deleteResponse = await fetch(`/api/connections/${targetEdge.id}/`, {
        method: 'DELETE',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'X-Action-Group-Id': actionGroupId,
          'X-Argument-Map-Id': get().argumentMapId,

        }),
        credentials: 'include',
      });
  
      if (!deleteResponse.ok) {
        console.error("Delete edge request failed:", deleteResponse.status);
        return [0, "Tekkis probleem argumendi kustutamisel!"];
      }
  
      set({
        nodes: get().nodes.filter(node => node.id !== nodeId),
        edges: get().edges
          .filter(edge => edge.target !== nodeId)
          .map(edge => {
            if (edge.source === nodeId) {
              return { ...edge, source: newSourceId };
            }
            return edge;
          }),
      });
  
      return [1, "Argument kustutati."];
    } catch (err) {
      return [0, "Tekkis probleem argumendi kustutamisel!"];
    }
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
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    };

    try {

      const rootArgument = await fetchData(`/api/arguments/?argument_map=${argumentMapId}`);
      if (!rootArgument) {
        console.warn("No root argument found for this map.");
        return;
      }
      const rootNode: ArgumentNode[] = {
        ...rootArgument[0],
        type: 'argument-node',
      }
      

      const argumentEdges = await fetchData(`/api/connections/?argument_map=${argumentMapId}`);

      if (argumentEdges.length === 0) {
        console.warn("No connections found for this map.");
      }

      const argumentIdSet = new Set<string>();
      argumentEdges.forEach((edge: any) => {
        argumentIdSet.add(edge.source);
        argumentIdSet.add(edge.target);
      });

      const argumentIdList = Array.from(argumentIdSet).join(',');

      const argumentNodes = await fetchData(`/api/arguments/?ids=${argumentIdList}`);
      console.log("edges:", argumentEdges);
      const edges: Edge[] = argumentEdges.map((edge: any) => ({
        id: `${edge.id}`,
        source: `${edge.source}`,
        target: `${edge.target}`,
        data: { explanation: edge.explanation, stance: edge.data.stance, author: edge.data.author },
      }));
      
      const nodes: ArgumentNode[] = argumentNodes.map((node: any) => {
        const incomingEdge = edges.find((edge) => edge.target === node.id);
        return {
          ...node,
          type: 'argument-node',
          data: {
            ...node.data,
            stance: incomingEdge?.data?.stance,
          },
        };
      });
      
      console.log("Fetched nodes:", nodes);
      console.log(rootNode)

      const positionedNodes = applyDagreLayout(nodes.concat(rootNode), edges);
      
      set({
        argumentMapId: argumentMapId,
        nodes: positionedNodes,
        edges: edges,
      });
    } catch (error) {
      console.error('Error fetching argument map:', error);
    }
  },

  switchStance: async (nodeId: string): Promise<[0 | 1, string]> => {
    const actionGroupId = crypto.randomUUID();
    const edge = get().edges.find(edge => edge.target === nodeId);

    if (!edge) {
      return [0, "Seose muutmine ebaõnnestus – sobivat seost ei leitud!"];
    }

    let newStance: 'for' | 'against' | 'undefined';

    switch (edge.data?.stance) {
      case 'undefined':
        newStance = 'for';
        break;
      case 'for':
        newStance = 'against';
        break;
      case 'against':
        newStance = 'undefined';
        break;
      default:
        newStance = 'undefined';
    }

    const csrfToken = getCSRFToken();

    try {
      const response = await fetch(`/api/connections/${edge.id}/`, {
        method: 'PATCH',
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'X-Action-Group-Id': actionGroupId,
          'X-Argument-Map-Id': get().argumentMapId,
        }),
        credentials: 'include',
        body: JSON.stringify({
          data: {
            stance: newStance,
          },
        }),
      });

      if (!response.ok) {
        return [0, "Seose muutmine ebaõnnestus!"];
      }
      
      set({
        edges: get().edges.map((e) =>
          e.id === edge.id ? { ...e, data: { ...e.data, stance: newStance } } : e
        ),
        nodes: get().nodes.map((node) =>
          node.id === edge.target ? { ...node, data: { ...node.data, stance: newStance } } : node
        ),  
      });

      return [1, "Seose hoiak edukalt muudetud!"];
    } catch (error) {
      console.error("Error updating stance:", error);
      return [0, "Tekkis viga seose muutmisel!"];
    }
  },



  createArgumentWithConnection: async (parentArgumentId: string, content: string): Promise<boolean> => {
    const actionGroupId = crypto.randomUUID();


    const newNode = await get().createArgument(content, actionGroupId);
    if (!newNode) return false;

    const newEdge = await get().connectArguments(parentArgumentId, newNode.id, actionGroupId);
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


  createArgument: async (content: string, actionGroupId: string): Promise<ArgumentNode | null> => {
    const csrfToken = getCSRFToken();

    try {
      const nodeResponse = await fetch('/api/arguments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
          'X-Action-Group-Id': actionGroupId,
          'X-Argument-Map-Id': get().argumentMapId,
        },
        credentials: 'include',
        body: JSON.stringify({
          argument_map: [get().argumentMapId],
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
      };

      return newNode;
    } catch (err) {
      console.error("Error creating node:", err);
      return null;
    }
  },

  connectArguments: async (sourceId: string, targetId: string, actionGroupId: string = crypto.randomUUID() ) => {

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
              'X-Action-Group-Id': actionGroupId,
              'X-Argument-Map-Id': get().argumentMapId,

            }),
            credentials: 'include',
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
          'X-Action-Group-Id': actionGroupId,
          'X-Argument-Map-Id': get().argumentMapId,

        },
        credentials: 'include',
        body: JSON.stringify({
          argument_map: argumentMapId,
          source: sourceId,
          target: targetId,
          data: { stance: 'undefined' },
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
        credentials: 'include',
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
  },
undo: async (): Promise<[0 | 1, string]> => {
  try {
    const response = await fetch('/api/undo/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken() || '',
        'X-Argument-Map-Id': get().argumentMapId,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.log("Response not ok:", response);
      let errorMessage = 'Tagasivõtmine ebaõnnestus';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch (error) {
        console.error('Error parsing error response:', error);
      }
      console.error('Undo failed:', errorMessage);
      return [0, errorMessage];
    } else if (response.status == 204) {
      return [0, 'Pole midagi tagasi võtta.'];
    }else {
      return [1, 'Tagasivõtmine õnnestus.'];
    }
  } catch (error) {
    console.error('Error during undo request:', error);
    return [0, 'Tagasivõtmine ebaõnnestus'];
  }
},

  
  reloadMap: () => {
    get().getMap(get().argumentMapId);
  },
  


}));

export default useArgumentStore;
