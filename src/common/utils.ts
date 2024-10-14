export function isVersionGreaterOrEqual(requiredVersion: string, currentVersion: string): boolean {
    const required = requiredVersion.split('.').map(Number);
    const current = currentVersion.split('.').map(Number);

    for (let i = 0; i < required.length; i++) {
        if (current[i] > required[i]) return true;
        if (current[i] < required[i]) return false;
    }

    return true;
}