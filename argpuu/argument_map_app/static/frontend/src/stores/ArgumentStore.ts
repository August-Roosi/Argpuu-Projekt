import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, Edge } from '@xyflow/react';
import { AppNode, type OperatorNodes, type AppState, type ArgumentNodes } from '../nodes/types';
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
    const operatorNode = get().nodes.find(node => 
      node.type == "operator-node" && 
      Array.isArray((node.data as { argument_ids: string[] }).argument_ids) &&
      (node.data as { argument_ids: string[] }).argument_ids.includes(nodeId)
    );
    if (!operatorNode){
      console.error("Did not find operator node for argument node!")
      return [0, "Ebaõnnestus argumendi kustutamine."]
    }
    const targetEdge = get().edges.find(edge => edge.target === operatorNode.id);
  
    if (!targetEdge) {
      console.error("Target edge not found for node ID:", nodeId);
      return [0, "Tekkis probleem argumendi kustutamisel!"];
    }
  

    const newSourceId = targetEdge.source;
    const affectedEdges = get().edges.filter(edge => edge.source === nodeId);
    const updatedArgumentIds = (operatorNode.data as { argument_ids: string[] }).argument_ids.filter(id => id !== nodeId);
    
    const csrfToken = getCSRFToken();
    
    try {
      const operatorPatchResponse = await fetch(`/api/operators/${operatorNode.id}/`, {
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
            argument_ids: updatedArgumentIds
          }
        }),
      });
    
      if (!operatorPatchResponse.ok) {
        console.error("Failed to patch operator node:", operatorPatchResponse.status);
        return [0, "Tekkis probleem rühma uuendamisel!"];
      }
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
      let updatedNodes = get().nodes.map(node => {
        if (node.id === operatorNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              argument_ids: updatedArgumentIds
            }
          };
        }
        return node;
      });
      
      updatedNodes = updatedNodes.filter(node => {
        if (node.id === nodeId) return false;
        if (
          node.id === operatorNode.id &&
          updatedArgumentIds.length === 0
        ) return false;
        return true;
      });

      const positionedNodes = applyDagreLayout(
        updatedNodes,
        get().edges
      );
      
      
      set({
        nodes: positionedNodes,        
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
      const rootNode: AppNode = {
        ...rootArgument[0],
        type: 'argument-node',
      }

      const argumentEdges = await fetchData(`/api/connections/?argument_map=${argumentMapId}`);
      const operators = await fetchData(`/api/operators/?argument_map=${argumentMapId}`);

    
      if (argumentEdges.length === 0) {
        console.warn("No connections found for this map.");
      }
      if (operators.length === 0) {
        console.warn("No operators found for this map.");
      }

      const edges: Edge[] = argumentEdges.map((edge: any) => ({
        id: `${edge.id}`,
        source: `${edge.source}`,
        target: `${edge.target}`,
        data: { explanation: edge.explanation, stance: edge.data.stance, author: edge.data.author },
      }));

      const operatorNodes: OperatorNodes[]= operators.map((operator: OperatorNodes)=>{
        const incomingEdge = edges.find((edge) => edge.target === operator.id);
        
        return {
          ...operator,
          type: "operator-node",
          data: {
            ...operator.data,
            stance: incomingEdge?.data?.stance,

          }

        }
      });


      const argumentIdSet = new Set<string>();
      operatorNodes.forEach((operator: OperatorNodes) => {
        operator.data.argument_ids.forEach((id: string) => argumentIdSet.add(id));
      });
      const argumentIdList = Array.from(argumentIdSet).join(',');
      const argumentNodes = await fetchData(`/api/arguments/?ids=${argumentIdList}`);



      const nodes: AppNode[] = argumentNodes.map((node: any) => {
        const operator = operatorNodes.find((operator: OperatorNodes)=> operator.data.argument_ids.includes(node.id))
        return {
          ...node,
          type: 'argument-node',
          parentId: operator?.id,
          extent: operator? 'parent':'',
          draggable: false,
          data: {
            ...node.data,
          },
        };
      });

      

      const positionedNodes = applyDagreLayout(
        [rootNode].concat(operatorNodes).concat(nodes),
        edges
      );
      
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

    const newOperator = await get().createOperator(actionGroupId, newNode.id)
    if (!newOperator) return false;

    const newEdge = await get().connectArguments(parentArgumentId, newOperator.id, actionGroupId);
    if (!newEdge) return false;


    const positionedNodes = applyDagreLayout(
      [...get().nodes, { ...newNode, parentId: newOperator.id, extent:'parent'}, newOperator],
      [...get().edges, newEdge]
    );

    console.log("positi", positionedNodes)
    set({
      nodes: positionedNodes,
      edges: [...get().edges, newEdge],
    });

    console.log("Node and edge created successfully.");
    return true;
  },

  createOperator: async (actionGroupId: string, argumentId): Promise<OperatorNodes | null> => {
    const csrfToken = getCSRFToken();
  
    try {
      const operatorResponse = await fetch('/api/operators/', {
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
          data: {argument_ids: [argumentId]}
        }),
      });
  
      if (!operatorResponse.ok) {
        throw new Error(`Operator creation failed: ${operatorResponse.status}`);
      }
  
      const operatorData = await operatorResponse.json();
  
      const OperatorNode: OperatorNodes = {
        ...operatorData,
        type: "operator-node",
      };
  
      return OperatorNode;
    } catch (err) {
      console.error("Error creating operator:", err);
      return null;
    }
  },
  

  createArgument: async (content: string, actionGroupId: string): Promise<ArgumentNodes | null> => {
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

      const newNode: ArgumentNodes = {
        ...nodeData,
        type: "argument-node",
      };

      return newNode;
    } catch (err) {
      console.error("Error creating node:", err);
      return null;
    }
  },
  createSiblingArgument: async (operatorId: string, content: string): Promise<boolean> => {
    const csrfToken = getCSRFToken();
    const actionGroupId = crypto.randomUUID();
  
    const newNode = await get().createArgument(content, actionGroupId);
    if (!newNode) return false;
    console.log(newNode)
    console.log(operatorId)
    const operatorNode = get().nodes.find(node => node.id === operatorId && node.type === 'operator-node');
    if (!operatorNode) return false;
    console.log(operatorNode)

    
    const currentArgumentIds = Array.isArray((operatorNode.data as { argument_ids: string[] }).argument_ids)
      ? Array.isArray((operatorNode.data as { argument_ids: string[] }).argument_ids)
        ? (operatorNode.data as { argument_ids: string[] }).argument_ids
        : []
      : [];
  
    const updatedArgumentIds = [...currentArgumentIds, newNode.id];
    console.log("updatedids",updatedArgumentIds)
  
    const patchRes = await fetch(`/api/operators/${operatorId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
        'X-Action-Group-Id': actionGroupId,
        'X-Argument-Map-Id': get().argumentMapId,
      },
      credentials: 'include',
      body: JSON.stringify({
        data: {
          argument_ids: updatedArgumentIds,
        }
      }),
    });
  
    if (!patchRes.ok) {
      console.error('Failed to patch operator with new argument');
      return false;
    }
  
    const updatedNodes: AppNode[] = [
      ...get().nodes.map(n => {
        if (n.id === operatorId) {
          return {
            ...n,
            data: {
              ...n.data,
              argument_ids: updatedArgumentIds,
            },
          };
        }
        return n;
      }),
      { ...newNode, parentId: operatorId, extent: 'parent' },
    ];
  
    const positionedNodes = applyDagreLayout(updatedNodes, get().edges);
  
    set({ nodes: positionedNodes });
  
    console.log('Sibling argument created and added.');
    return true;
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
          source: sourceId,
          target: targetId,
          data: { stance: 'undefined' },
        }),
      });

      if (!edgeResponse.ok) {
        const errorData = await edgeResponse.json();
        throw new Error(`Edge creation failed: ${errorData?.detail || 'Unknown error'}`);
      }

      const newEdge = await edgeResponse.json();
      return newEdge;
    } catch (err) {
      console.error("Error creating edge:", err);
      return null;
    }
  },



  getArguments: async (id?: string): Promise<ArgumentNodes[]> => {
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

      const nodes: ArgumentNodes[] = argumentArray.map((node: any) => ({
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
