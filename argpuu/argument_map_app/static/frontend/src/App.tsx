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
  getMap: state.getMap,
});




function Flow({ argumentMapId }: FlowProps) {


  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, getMap } = useStore(
    useShallow(selector),
  );


  useEffect(() => {
    console.log("Flow component has mounted.");
    console.log("Argument Map ID:", argumentMapId);
    if (argumentMapId) {
      getMap(argumentMapId);
    }
  }, [argumentMapId]); 
  

  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    console.log("Node clicked:", node);
    console.log("Current edges:", edges);
  };


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
      </ReactFlow>


    </div>
  );
}

export default Flow;