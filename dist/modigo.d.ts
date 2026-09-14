/**
 * Modigo SDK v1
 *
 * Drop-in JavaScript SDK for embedding the full Modigo IDE
 * (Monaco editor + file explorer + multi-terminal + shell + activity bar)
 * into any website via iframe.
 *
 * Usage (single-file editor):
 *   modigo.init({
 *     apiKey: 'mk_live_...',
 *     container: '#editor',
 *     instruction: 'Write a function that reverses a string.',
 *     language: 'python',
 *     starterCode: 'def reverse(s):\n    return s[::-1]\n',
 *     onSubmit: (result) => console.log(result),
 *   });
 *
 * Usage (multi-file project):
 *   modigo.init({
 *     apiKey: 'mk_live_...',
 *     container: '#editor',
 *     files: [
 *       { name: 'main.py',   content: 'from utils import add\nprint(add(2,3))\n' },
 *       { name: 'utils.py',  content: 'def add(a, b):\n    return a + b\n' },
 *     ],
 *     folders: ['lib'],
 *     onSubmit: (result) => console.log(result),
 *   });
 *
 * Usage (group session / assessment):
 *   modigo.init({
 *     apiKey: 'mk_live_...',
 *     container: '#editor',
 *     session: { id: 42, participantId: 'user_jane', displayName: 'Jane Doe' },
 *     onSubmit: (result) => console.log(result),
 *     onSessionEnd: (results) => console.log(results),
 *   });
 */
export interface ModigoSessionConfig {
    id: number | string;
    participantId: string;
    displayName?: string;
}
export interface ModigoSubmitResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    status: 'Accepted' | 'Test Failed' | 'Runtime Error' | 'Error';
    score?: number;
    file?: string;
}
export interface ModigoSessionResult {
    rank: number;
    participantId: string;
    displayName?: string;
    score: number;
    challengesSolved: number;
    timeTakenSeconds: number | null;
}
export interface ModigoFile {
    name: string;
    content: string;
    language?: string;
}
export interface ModigoConfig {
    apiKey: string;
    container: string | HTMLElement;
    instruction?: string;
    language?: string;
    starterCode?: string;
    files?: ModigoFile[];
    folders?: string[];
    filename?: string;
    session?: ModigoSessionConfig;
    height?: string | number;
    width?: string | number;
    onReady?: () => void;
    onSubmit?: (result: ModigoSubmitResult & {
        file?: string;
    }) => void;
    onSessionEnd?: (results: ModigoSessionResult[]) => void;
    onFileChange?: (file: ModigoFile) => void;
    onFilesChange?: (files: ModigoFile[], folders: string[]) => void;
    onError?: (error: {
        code: string;
        message: string;
    }) => void;
}
export interface ModigoInstance {
    destroy(): void;
    send(type: string, payload?: Record<string, unknown>): void;
    getFiles(): ModigoFile[];
    getFolders(): string[];
    setFiles(files: ModigoFile[]): void;
    updateFile(name: string, content: string): void;
}
export declare function init(config: ModigoConfig): Promise<ModigoInstance>;
declare const modigo: {
    init: typeof init;
};
export default modigo;
