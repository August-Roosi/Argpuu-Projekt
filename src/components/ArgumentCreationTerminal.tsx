import React, { useRef } from 'react';
import { IoMdClose } from 'react-icons/io';
import toast from 'react-hot-toast';
import useModalStore from '../stores/ModalStore';
import useSearchStore from '../stores/SearchStore';
import useArgumentStore from '../stores/ArgumentStore';

interface ArgumentCreationTerminalProps {
    isArgumentMapReadOnly?: boolean;
}

const ArgumentCreationTerminal: React.FC<ArgumentCreationTerminalProps> = ({isArgumentMapReadOnly}) => {

    const { createArgumentWithConnection, createSiblingArgument } = useArgumentStore();
    const { isSibling, nodeId: parentArgumentId, closeModal } = useModalStore();
    const { searchTerm, setSearchTerm, filteredArguments, loadingArguments} = useSearchStore();


    const modalRef = useRef<HTMLDivElement>(null);
    const handleClose = () => {
        setSearchTerm("");
        closeModal();
    };

    const results = filteredArguments(parentArgumentId ?? "");


    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;

        if (isArgumentMapReadOnly) {
            toast.error("Autor on keelanud kaardi redigeerimise.");
            return;
        }
        if (searchTerm.length > 1000) {
            toast.error("Argumendi tekst on liiga pikk!");
            return;
        }
        if (!parentArgumentId) {
            toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
            return;
        }

        const result = isSibling
            ? await createSiblingArgument(parentArgumentId, { content: searchTerm })
            : await createArgumentWithConnection(parentArgumentId, { content: searchTerm });

        if (!result) {
            toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
            return;
        }

        handleClose();
        toast.success("Argument loodud!");
    };

    const handleUseArgument = async (id: string) => {
        if (isArgumentMapReadOnly) {
            toast.error("Autor on keelanud kaardi redigeerimise.");
            return;
        }
        if (!parentArgumentId) {
            toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
            return;
        }

        const result = isSibling
            ? await createSiblingArgument(parentArgumentId, { newArgumentId: id })
            : await createArgumentWithConnection(parentArgumentId, { newArgumentId: id });

        if (!result) {
            toast.error("Tekkis viga, palun proovi uuesti või saada arendajale tagasisidet.");
            return;
        }

        handleClose();
        toast.success("Argument kopeeritud teisest kaardist!");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-gray-200 rounded-none w-[600px] max-h-[40vh] overflow-hidden shadow-lg" ref={modalRef}>
                <div className="flex-row justify-between items-center p-1 bg-gray-50">
                    <div className='flex justify-end'>
                        <button className='px-1' onClick={handleClose}>
                            <IoMdClose />
                        </button>
                    </div>

                    <input
                        type="text"
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
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
                        <ul className="space-y-1">
                            {results.map((arg) => (
                                <li
                                    key={arg.id}
                                    className="p-3 pl-9 pb-1 pt-1 border rounded-none hover:bg-gray-100 cursor-pointer flex flex-row justify-between items-center"
                                    onClick={() => handleUseArgument(arg.id)}
                                >
                                    <p className={`font-medium ${arg.data.content !== "" ? "" : "text-gray-500 text-sm"}`}>
                                        {arg.data.content !== "" ? arg.data.content : "tekst puudu"}
                                    </p>
                                    <p className="text-sm text-gray-500 text-center">ID: {arg.id}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ArgumentCreationTerminal;
