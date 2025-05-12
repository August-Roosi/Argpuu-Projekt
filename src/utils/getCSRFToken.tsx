export function getCSRFToken(): string | undefined {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === 'csrftoken') {
            return value || undefined;
        }
    }
    return undefined; 
}
