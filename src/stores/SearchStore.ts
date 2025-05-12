import { create } from 'zustand';
import { type ArgumentNodes } from '../nodes/types';
import { getCSRFToken } from '../utils/getCSRFToken';

interface SearchState {
    
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedArgument: ArgumentNodes | null;
    setSelectedArgument: (arg: ArgumentNodes | null) => void;
    argumentsList: ArgumentNodes[];
    setArgumentsList: (args: ArgumentNodes[]) => void;
    loadingArguments: boolean;
    setLoadingArguments: (loading: boolean) => void;
    filteredArguments: (currentNodeId: string) => ArgumentNodes[];
    getArgumentsFromApi: (argumentMapId: string) => Promise<void>;
}

const useSearchStore = create<SearchState>((set, get) => ({
    searchTerm: '',
    setSearchTerm: (term) => {
        set({ searchTerm: term, selectedArgument: null });
    },

    selectedArgument: null,
    setSelectedArgument: (arg) => {
        set({ selectedArgument: arg });
    },

    argumentsList: [],
    setArgumentsList: (args) => {
        console.log('Setting arguments list:', args.length);
        set({ argumentsList: args });
    },

    loadingArguments: true,
    setLoadingArguments: (loading) => {
        set({ loadingArguments: loading });
    },

    filteredArguments: (currentNodeId: string) =>
        get().argumentsList.filter((arg) => {
            const content = arg.data.content as string | undefined;
            return (
                content?.toLowerCase().includes(get().searchTerm.toLowerCase()) &&
                arg.id !== currentNodeId
            );
        }),

    getArgumentsFromApi: async (argumentMapId:string) => {
        const csrfToken = getCSRFToken();
        set({ loadingArguments: true });

        try {
            const response = await fetch(`/api/arguments/?exclude_argument_map=${argumentMapId}`, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken || '',
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch arguments: ${response.status}`);
            }

            const argumentNodes = await response.json();

            const nodes: ArgumentNodes[] = argumentNodes.map((node: any) => ({
                ...node,
                type: 'argument-node',
            }));

            set({ argumentsList: nodes });
        } catch (error) {
            console.error("Error fetching arguments:", error);
            set({ argumentsList: [] });
        } finally {
            set({ loadingArguments: false });
        }
    },
}));

export default useSearchStore;
