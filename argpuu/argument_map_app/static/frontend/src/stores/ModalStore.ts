// stores/ModalStore.ts
import { create } from 'zustand';

interface ModalState {
    isOpen: boolean;
    nodeId: string | null;
    openModal: (id: string) => void;
    closeModal: () => void;
}

const useModalStore = create<ModalState>((set) => ({
    isOpen: false,
    nodeId: null,
    openModal: (id) => set({ isOpen: true, nodeId: id }),
    closeModal: () => set({ isOpen: false, nodeId: null }),
}));

export default useModalStore;
