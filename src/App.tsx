import {
  ReactFlow,
  Background,
} from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import '@xyflow/react/dist/style.css';

import { AppState, nodeTypes } from "./nodes/types";
import { edgeTypes } from "./edges";
import useArgumentStore from './stores/ArgumentStore';
import { useShallow } from 'zustand/react/shallow';
import useModalStore from './stores/ModalStore';
import useSearchStore from './stores/SearchStore';
import Titlebar from './components/Titlebar';
import Toolbar from './components/Toolbar';
import ArgumentCreationTerminal from './components/ArgumentCreationTerminal';

const argumentMapId = window.argumentMapId;
const argumentMapsViewUrl = window.argumentMapsViewUrl;
const argumentMapTitle = window.argumentMapTitle;
const argumentMapAuthor = window.argumentMapAuthor;
const isArgumentMapReadOnly = window.isArgumentMapReadOnly;


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
  createSiblingArgument: state.createSiblingArgument,
  
});




function Flow() {


  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, getMap } = useArgumentStore(useShallow(selector),);
  const { isOpen, closeModal } = useModalStore();
  const {
    setSearchTerm,
    getArgumentsFromApi,
  } = useSearchStore();

  const modalRef = useRef<HTMLDivElement>(null);



  const handleClose = () => {
    setSearchTerm("");
    closeModal();
  };
  
  useEffect(() => {
    console.log("Flow component has mounted.");
    console.log("Argument Map ID:", argumentMapId);
    if (argumentMapId && !isOpen) {
      getMap(argumentMapId, isArgumentMapReadOnly);
    }
    if (isOpen) {
      getArgumentsFromApi(argumentMapId);
    } 
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };


  }, [argumentMapId, isOpen, getArgumentsFromApi]);


  const handleNodeClick = (_: React.MouseEvent, node: any) => {
    console.log("Node clicked:", node);
    console.log("Current edges:", edges);
  };


  return (
    <div style={{ height: '100%' }} className='bg-gray-700'>
      <Toaster position="top-center" reverseOrder={false} />

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
        fitView
        zoomOnScroll={false}  
        panOnScroll={true}      

        fitViewOptions={{ padding: 0.3 }}
      >
        <Titlebar title={argumentMapTitle} author={argumentMapAuthor} targetUrl={argumentMapsViewUrl} />
        <Toolbar/>
        <Background/>
        {isOpen && (<ArgumentCreationTerminal isArgumentMapReadOnly={isArgumentMapReadOnly}/>)}
      </ReactFlow>


    </div>
  );
}

export default Flow;