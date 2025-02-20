import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {EditorData} from '../editor.service';

@Injectable({
    providedIn: 'root',
})
export class ApiConsoleService {
    private readonly httpClient = inject(HttpClient);

    stop(): Observable<void> {
        return this.httpClient.delete('/api/console/').pipe(
            map(() => {}),
        );
    }

    input(kind: InputKinds.console, input: string): Observable<void>;
    input(kind: InputKinds.editor, input: EditorData): Observable<void>;
    input(kind: InputKind, input: any): Observable<void> {
        const headers: Record<string, any> = {
            'X-Input-Type': kind,
        };
        let body = input;

        if (kind === InputKinds.editor) {
            headers['X-Editor-Filename'] = input.filename;
            body = input.data;
        }

        return this.httpClient.put('/api/console/', JSON.stringify(body), {headers}).pipe(
            map(() => {}),
        );
    }
}

export enum InputKinds {
    console = 'console',
    editor = 'editor',
}

export type InputKind = keyof typeof InputKinds;
