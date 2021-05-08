import * as monaco from 'monaco-editor';

declare module 'monaco' {
    interface IRootScopeService {
        $$destroyed: boolean;
    }
}

export as namespace monaco;
export = monaco;