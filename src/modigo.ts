

const EMBED_BASE = 'https://modigo.online/embed/editor';
const API_BASE   = 'https://api.modigo.online/api/v1';


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
  onSubmit?: (result: ModigoSubmitResult & { file?: string }) => void;
  onSessionEnd?: (results: ModigoSessionResult[]) => void;
  onFileChange?: (file: ModigoFile) => void;
  onFilesChange?: (files: ModigoFile[], folders: string[]) => void;
  onError?: (error: { code: string; message: string }) => void;
}

export interface ModigoInstance {
  destroy(): void;
  send(type: string, payload?: Record<string, unknown>): void;
  getFiles(): ModigoFile[];
  getFolders(): string[];
  setFiles(files: ModigoFile[]): void;
  updateFile(name: string, content: string): void;
}


function resolveContainer(container: string | HTMLElement): HTMLElement | null {
  if (typeof container === 'string') {
    return document.querySelector<HTMLElement>(container);
  }
  return container;
}

function buildEmbedUrl(config: ModigoConfig, editorToken: string): string {
  const params = new URLSearchParams();
  params.set('token', editorToken);

  if (config.session) {
    params.set('session_id',       String(config.session.id));
    params.set('participant_id',   config.session.participantId);
    if (config.session.displayName) {
      params.set('display_name', config.session.displayName);
    }
  } else {
    if (config.instruction) params.set('instruction', config.instruction);
    if (config.language)    params.set('language',    config.language);
    if (config.starterCode) params.set('code',        config.starterCode);
    if (config.filename)    params.set('filename',    config.filename);
  }

  if (config.files && config.files.length > 0) {
    params.set('files', JSON.stringify(config.files));
  }
  if (config.folders && config.folders.length > 0) {
    params.set('folders', JSON.stringify(config.folders));
  }

  return `${EMBED_BASE}?${params.toString()}`;
}

async function fetchEditorToken(apiKey: string): Promise<string> {
  const res = await fetch(`${API_BASE}/editor/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.message || body.error || `Auth failed (${res.status})`);
  }

  const data = await res.json() as { token: string };
  return data.token;
}


export async function init(config: ModigoConfig): Promise<ModigoInstance> {
  const el = resolveContainer(config.container);
  if (!el) {
    throw new Error(`[Modigo] Container not found: ${config.container}`);
  }

  let editorToken: string;
  try {
    editorToken = await fetchEditorToken(config.apiKey);
  } catch (err: unknown) {
    const msg = (err as Error).message;
    config.onError?.({ code: 'auth_failed', message: msg });
    throw err;
  }

  let currentFiles: ModigoFile[] = config.files ?? [];
  let currentFolders: string[] = config.folders ?? [];

  const iframe = document.createElement('iframe');
  iframe.src                          = buildEmbedUrl(config, editorToken);
  iframe.style.border                 = 'none';
  iframe.style.width                  = typeof config.width  === 'number' ? `${config.width}px`  : (config.width  ?? '100%');
  iframe.style.height                 = typeof config.height === 'number' ? `${config.height}px` : (config.height ?? '600px');
  iframe.style.display                = 'block';
  iframe.allow                        = 'clipboard-write';
  iframe.setAttribute('loading',       'eager');
  iframe.setAttribute('title',         'Modigo Code Editor');

  el.innerHTML = '';
  el.appendChild(iframe);

  const handleMessage = (event: MessageEvent) => {
    if (!event.origin.includes('modigo.online')) return;
    if (!event.data || typeof event.data.type !== 'string') return;

    const { type, payload } = event.data as { type: string; payload: Record<string, unknown> };

    switch (type) {
      case 'modigo:ready':
        config.onReady?.();
        break;

      case 'modigo:submit':
        config.onSubmit?.({
          exitCode:  payload.exit_code  as number,
          stdout:    payload.stdout     as string,
          stderr:    payload.stderr     as string,
          status:    payload.status     as ModigoSubmitResult['status'],
          score:     payload.score      as number | undefined,
          file:      payload.file       as string | undefined,
        });
        break;

      case 'modigo:session_end':
        config.onSessionEnd?.(
          (payload.results as ModigoSessionResult[] | undefined) ?? [],
        );
        break;

      case 'modigo:error':
        config.onError?.({
          code:    payload.code    as string,
          message: payload.message as string,
        });
        break;

      case 'modigo:file-change':
        if (payload.file && typeof payload.code === 'string') {
          const updated: ModigoFile = {
            name:    payload.file as string,
            content: payload.code as string,
          };
          currentFiles = currentFiles.map(f => f.name === payload.file ? updated : f);
          config.onFileChange?.(updated);
        }
        break;

      case 'modigo:files-change':
        if (Array.isArray(payload.files)) {
          currentFiles = payload.files as ModigoFile[];
          config.onFilesChange?.(currentFiles, currentFolders);
        }
        break;

      case 'modigo:folders-change':
        if (Array.isArray(payload.folders)) {
          currentFolders = payload.folders as string[];
        }
        break;

      case 'modigo:run-start':
        config.onSubmit?.({
          exitCode: 0,
          stdout: '',
          stderr: '',
          status: 'Accepted',
          file: payload.file as string | undefined,
        });
        break;
    }
  };

  window.addEventListener('message', handleMessage);

  return {
    destroy() {
      window.removeEventListener('message', handleMessage);
      iframe.remove();
    },
    send(type: string, payload: Record<string, unknown> = {}) {
      iframe.contentWindow?.postMessage({ type, payload }, 'https://modigo.online');
    },
    getFiles() {
      return [...currentFiles];
    },
    getFolders() {
      return [...currentFolders];
    },
    setFiles(files: ModigoFile[]) {
      currentFiles = files;
      iframe.contentWindow?.postMessage(
        { type: 'set-files', files },
        'https://modigo.online'
      );
    },
    updateFile(name: string, content: string) {
      currentFiles = currentFiles.map(f => f.name === name ? { ...f, content } : f);
      iframe.contentWindow?.postMessage(
        { type: 'set-code', code: content, file: name },
        'https://modigo.online'
      );
    },
  };
}


const modigo = { init };
export default modigo;

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).modigo = modigo;
}
