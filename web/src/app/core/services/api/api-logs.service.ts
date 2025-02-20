import {lastValueFrom, map, Observable, shareReplay, take, tap} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {HttpClient} from '@angular/common/http';
import {DestroyRef, Injectable, Renderer2, RendererFactory2} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ApiLogsService {
    private readonly renderer2: Renderer2;

    constructor(
        private readonly httpClient: HttpClient,
        private readonly destroyRef: DestroyRef,
        rendererFactory2: RendererFactory2,
    ) {
        this.renderer2 = rendererFactory2.createRenderer(null, null);
    }

    logs(): Observable<LogListing[]> {
        return this.httpClient.get<LogListing[]>('/api/logs').pipe(
            shareReplay(1),
        );
    }

    deleteLog(id: string): Observable<void> {
        return this.httpClient.delete(`/api/logs/${id}`).pipe(map(() => {}));
    }

    async log(kind: LogKind, time: string, id: string): Promise<void> {
        return lastValueFrom(this.httpClient.get(`/api/logs/${id}`, {responseType: 'blob'}).pipe(
            takeUntilDestroyed(this.destroyRef),
            take(1),
            tap(r => {
                const a = this.renderer2.createElement('a');
                a.href = window.URL.createObjectURL(new Blob([r], {type: r.type}));
                this.renderer2.setAttribute(a, 'download', `${kind}_${time}_${id}.zip`);
                this.renderer2.appendChild(document.body, a);
                a.dispatchEvent(new MouseEvent('click'));
                this.renderer2.removeChild(a.parentNode, a);
            }),
            map(() => {}),
        ));
    }
}

export enum LogKindList {
    Import = 'import',
}

export type LogKind = keyof typeof LogKindList;

export type LogListing = {
    id: string;
    time: string;
    kind: LogKind;
    name: string;
    size: number;
};
