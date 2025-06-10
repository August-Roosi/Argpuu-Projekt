export {};

declare global {
    interface Window {
        argumentMapId: string;
        argumentMapsViewUrl: string;
        argumentMapTitle: string;
        argumentMapAuthor: string;
        isAuthor: boolean;
        isArgumentMapReadOnly: boolean;
    }
}