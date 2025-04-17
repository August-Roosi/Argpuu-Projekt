import {
  ReactFlow,
  Controls,
  Background,
} from '@xyflow/react';
import { useEffect } from 'react';


import '@xyflow/react/dist/style.css';

import { AppState, nodeTypes } from "./nodes/types";
import { edgeTypes } from "./edges/";
import useArgumentStore from './stores/ArgumentStore';
import { useShallow } from 'zustand/react/shallow';
import useModalStore from './stores/ModalStore';
import useSearchStore from './stores/SearchStore';

interface FlowProps {
  argumentMapId: string;
}


const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  createArgument: state.createArgument,
  getMap: state.getMap,
  connectArguments: state.connectArguments,
  createArgumentWithConnection: state.createArgumentWithConnection,
});




function Flow({ argumentMapId }: FlowProps) {


  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, getMap, connectArguments, createArgumentWithConnection } = useArgumentStore(useShallow(selector),);
  const { isOpen, nodeId: parentArgumentId, closeModal } = useModalStore();
  const { searchTerm,
    setSearchTerm,
    filteredArguments,
    getArgumentsFromApi,
    loadingArguments,
  } = useSearchStore();


  useEffect(() => {
    console.log("Flow component has mounted.");
    console.log("Argument Map ID:", argumentMapId);
    if (argumentMapId) {
      getMap(argumentMapId);
    }
    if (isOpen) {
      getArgumentsFromApi(argumentMapId);
    }
  }, [argumentMapId, isOpen, getArgumentsFromApi]); 
  

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    console.log("Node clicked:", node);
    console.log("Current edges:", edges);
  };

  const results = filteredArguments(parentArgumentId ?? "");

  return (
    <div style={{ height: '100%' }}>
  
      <ReactFlow 
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}

      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onConnect={onConnect}
      defaultEdgeOptions={{ type: "smoothstep" }}
      fitView>
        <Background/>
        <Controls/>

        {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Search Arguments</h2>
              <button onClick={closeModal} className="text-red-500 text-xl font-bold">
                &times;
              </button>
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={async (e) => {
                if (parentArgumentId && e.key === "Enter") {
                  const result = await createArgumentWithConnection(parentArgumentId, searchTerm);
                  if (result) {
                    closeModal();
                  } 
                } else {
                    
                  console.error("Parent argument ID is null.");
                }
              }}
              placeholder="Search here..."
              className="w-full border p-2 rounded mb-4"
            />

            <p className="text-sm text-gray-500 mb-2">Opened for node ID: {parentArgumentId}</p>

            {loadingArguments ? (
              <p className="text-gray-600">Loading arguments...</p>
            ) : results.length === 0 ? (
              <p className="text-gray-600">No arguments found.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((selectedArgument) => (
                  <li
                    key={selectedArgument.id}
                    className={`p-3 border rounded hover:bg-gray-100 cursor-pointer ${
                      selectedArgument?.id === selectedArgument.id ? 'bg-blue-100 border-blue-400' : ''
                    }`}
                    onClick={async () => {
                      if (parentArgumentId) {
                        const result = await connectArguments(parentArgumentId, selectedArgument.id);
                        if (result) {
                          closeModal();
                        } else {
                          console.error("Failed to connect arguments");
                        }
                      }
                    }}
                  >
                    <p className="font-medium">{selectedArgument.data.content}</p>
                    <p className="text-sm text-gray-500">ID: {selectedArgument.id}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      </ReactFlow>


    </div>
  );
}

export default Flow;