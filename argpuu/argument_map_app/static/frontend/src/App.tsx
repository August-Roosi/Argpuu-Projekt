import {
  ReactFlow,
  Background,
} from '@xyflow/react';
import { useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { IoMdClose } from "react-icons/io";
import '@xyflow/react/dist/style.css';

import { AppState, nodeTypes } from "./nodes/types";
import { edgeTypes } from "./edges/";
import useArgumentStore from './stores/ArgumentStore';
import { useShallow } from 'zustand/react/shallow';
import useModalStore from './stores/ModalStore';
import useSearchStore from './stores/SearchStore';
import Titlebar from './components/Titlebar';
import Toolbar from './components/Toolbar';

const argumentMapId = window.argumentMapId;
const argumentMapsViewUrl = window.argumentMapsViewUrl;
const argumentMapTitle = window.argumentMapTitle;
const argumentMapAuthor = window.argumentMapAuthor;


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


  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, getMap, connectArguments, createArgumentWithConnection, createSiblingArgument } = useArgumentStore(useShallow(selector),);
  const { isOpen, isSibling, nodeId: parentArgumentId, closeModal } = useModalStore();
  const { searchTerm,
    setSearchTerm,
    filteredArguments,
    getArgumentsFromApi,
    loadingArguments,
  } = useSearchStore();

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Flow component has mounted.");
    console.log("Argument Map ID:", argumentMapId);
    if (argumentMapId && !isOpen) {
      getMap(argumentMapId);
    }
    if (isOpen) {
      getArgumentsFromApi(argumentMapId);
    } 
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
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

  const results = filteredArguments(parentArgumentId ?? "");

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
        <Background />

        {isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-gray-200 rounded-none w-[600px] max-h-[40vh] overflow-hidden shadow-lg" ref={modalRef}>
              <div className="flex-row justify-between items-center p-1 bg-gray-50">
                <div className='flex justify-end'>
                  <button className='px-1' onClick={closeModal}>
                    <IoMdClose />
                  </button>
                </div>


                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={async (e) => {

                    if (e.key === "Enter") {
                      if (searchTerm.length > 1000) {
                        toast.error("Argumendi tekst on liiga pikk!");
                        return;
                      }
                      if (!parentArgumentId) {
                        toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
                        return;
                      }
                      let result;
                      if (isSibling){
                        result = await createSiblingArgument(parentArgumentId, searchTerm);
                      } else {
                        result = await createArgumentWithConnection(parentArgumentId, searchTerm);
                      }
                      if (!result) {
                        toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
                        return;
                      }
                      closeModal();
                      toast.success("Argument loodud!");
                    }

                  }}
                  placeholder="Otsi argumente või tee uus.."
                  className="w-full p-2 pl-8 rounded mb-4 text-xl bg-gray-50 focus:outline-none focus:bg-gray-50"
                />
              </div>
              
              <div className='overflow-y-scroll max-h-[27vh] border-solid border-gray-300'>
              <div className='flex justify-between items-center'>
                <div className='p-3 text-gray-600 text-sm'>
                  Teiste kaartide argumendid:

                </div>
                <div className='px-1 mr-3 text-sm bg-gray-300'>{results.length}</div>
              </div>

              {loadingArguments ? (
                <p className="text-gray-600 p-3">Laen argumente..</p>
              ) : results.length === 0 ? (
                <p className="text-gray-600 p-3">Argumente ei leitud.</p>
              ) : (
                
                <ul className="space-y-1 ">
                  {results.map((selectedArgument) => (
                    <li
                      key={selectedArgument.id}
                      className={`p-3 pl-9 pb-1 pt-1 border rounded-none hover:bg-gray-100 cursor-pointer flex flex-col! justify-between items-center `}
                      onClick={async () => {
                        if (!parentArgumentId) {
                          toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
                          return;
                        }
                        const result = await connectArguments(parentArgumentId, selectedArgument.id);
                        if (!result) {
                          toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
                          return;
                        }
                        closeModal();
                        toast.success("Argument kopeeritud teisest kaardist!");

                      }}
                    >
                      <p className={`font-medium ${selectedArgument.data.content!== "" ? "": "text-gray-500 text-sm"}`}>{selectedArgument.data.content !== "" ? selectedArgument.data.content : "tekst puudu"}</p>
                      <p className="text-sm text-gray-500 text-center">ID: {selectedArgument.id}</p>
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </div>
          </div>
        )}
      </ReactFlow>


    </div>
  );
}

export default Flow;