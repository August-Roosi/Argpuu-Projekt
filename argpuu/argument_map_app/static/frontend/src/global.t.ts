export {};

declare global {
    interface Window {
        argumentMapId: string;
        argumentMapsViewUrl: string;
        argumentMapTitle: string;
        argumentMapAuthor: string;
        isArgumentMapReadOnly: boolean;
    }
}