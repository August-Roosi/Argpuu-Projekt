import {
  ReactFlow,
  Controls,
  Background,
} from '@xyflow/react';
import { useEffect } from 'react';


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


  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, getMapNodes } = useStore(
    useShallow(selector),
  );


  useEffect(() => {
    console.log("Flow component has mounted.");
    console.log("Argument Map ID:", argumentMapId);
    if (argumentMapId) {
      getMapNodes(argumentMapId);
    }
  }, [argumentMapId]); 
  




  return (
    <div style={{ height: '100%' }}>
  
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