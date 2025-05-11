import { create } from 'zustand';

interface ModalState {
    isOpen: boolean;
    isSibling: boolean
    nodeId: string | null;
    openModal: (isSibling: boolean, id: string) => void;
    closeModal: () => void;

}

const useModalStore = create<ModalState>((set) => ({
    

    isOpen: false,
    isSibling: false,
    nodeId: null,
    openModal: (isSibling, id?) => set({ isOpen: true, nodeId: id, isSibling: isSibling }),
    closeModal: () => set({ isOpen: false, nodeId: null, isSibling: false }),
}));

export default useModalStore;
