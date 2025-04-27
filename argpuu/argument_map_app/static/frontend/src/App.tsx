import {
  ReactFlow,
  Background,
} from '@xyflow/react';
import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';


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
});




function Flow() {


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
    if (argumentMapId && !isOpen) {
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
    <div style={{ height: '100%' }} className='bg-gray-700 bg-sky-50'>
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
        fitViewOptions={{ padding: 0.3 }}
      >
        <Titlebar title={argumentMapTitle} author={argumentMapAuthor} targetUrl={argumentMapsViewUrl} />
        <Toolbar/>
        <Background />

        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Otsi argumente või tee uus..</h2>
                <button className='px-1' onClick={closeModal}>
                  <div className='bg-red-400 rounded-xl w-4 h-4 hover:bg-red-200 focus:bg-red-600'></div>
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
                    const result = await createArgumentWithConnection(parentArgumentId, searchTerm);
                    if (!result) {
                      toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
                      return;
                    }
                    closeModal();
                    toast.success("Argument loodud!");
                  }

                }}
                placeholder="Search here..."
                className="w-full border p-2 rounded mb-4"
              />

              {loadingArguments ? (
                <p className="text-gray-600">Laen argumente..</p>
              ) : results.length === 0 ? (
                <p className="text-gray-600">Argumente ei leitud.</p>
              ) : (
                <ul className="space-y-2">
                  {results.map((selectedArgument) => (
                    <li
                      key={selectedArgument.id}
                      className={`p-3 border rounded hover:bg-gray-100 cursor-pointer ${selectedArgument?.id === selectedArgument.id ? 'bg-blue-100 border-blue-400' : ''
                        }`}
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