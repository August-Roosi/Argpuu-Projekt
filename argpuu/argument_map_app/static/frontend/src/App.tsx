import {
  ReactFlow,
  Controls,
  Background,
} from '@xyflow/react';
import { useState, useEffect } from 'react';


import '@xyflow/react/dist/style.css';

import { AppState, nodeTypes } from "./nodes/types";
import { edgeTypes } from "./edges/";
import useStore from './store';
import { useShallow } from 'zustand/react/shallow';


interface FlowProps {
  argumentMapId: string;
}



const selector = (state: AppState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  createNode: state.createNode,
  getMapNodes: state.getMapNodes,
});




function Flow({ argumentMapId }: FlowProps) {


  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, getMapNodes, createNode } = useStore(
    useShallow(selector),
  );


  useEffect(() => {
    console.log("Flow component has mounted.");
    console.log("Argument Map ID:", argumentMapId);
    if (argumentMapId) {
      setIsPopupOpen(false); 
      getMapNodes(argumentMapId);
    }
  }, [argumentMapId]); 
  
  
  const [isPopupOpen, setIsPopupOpen] = useState(true); // Popup state
  const [nodeName, setNodeName] = useState(''); // Node name input


  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      handleCreateNode();
    }
  };

  const handleCreateNode = () => {
    if (nodeName.trim()) {
      createNode(nodeName, true); 
      setIsPopupOpen(false); 
    }
  };


  return (
    <div style={{ height: '100%' }}>
      {isPopupOpen && nodes.filter(node => 'isTopic' in node.data && node.data.isTopic).length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-xs">
          <div
            className="rounded-lg shadow-lg p-6 max-w-md w-full bg-stone-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 ">Kirjuta enda väide</h3>

            <div className="flex justify-between items-center mb-4 gap-2">
              


              <input
                type="text"
                placeholder="Kirjuta enda väide"
                value={nodeName}
                onKeyDown={handleKeyDown}
                onChange={(e) => setNodeName(e.target.value)}
                className="w-full m-0 px-4 py-2 text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:ring-1 focus:outline-none transition-all duration-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCreateNode}
                className="text-gray-600  px-4 py-2 rounded-md bg-green-600 hover:bg-opacity-50 focus:ring-2 focus:ring-green-300 focus:outline-none transition-all duration-300"
              >
                Valmis
              </button>


              <button
                onClick={() => setIsPopupOpen(false)}
                className="text-gray-600 text-white px-4 py-2 rounded-md bg-yellow-600 hover:bg-opacity-50 focus:ring-2 focus:ring-red-300 focus:outline-none transition-all duration-300"
              >
                Tagasi
              </button>
            </div>
          </div>
        </div>
      )}
  
      <ReactFlow 
      nodes={nodes}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}

      edges={edges}
      edgeTypes={edgeTypes}
      onEdgesChange={onEdgesChange}

      onConnect={onConnect}
      fitView>
        <Background/>
        <Controls/>
      </ReactFlow>


    </div>
  );
}

export default Flow;