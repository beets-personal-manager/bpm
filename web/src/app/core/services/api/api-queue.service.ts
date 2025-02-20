import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {map, Observable, shareReplay, take} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ApiQueueService {
    constructor(
        private readonly httpClient: HttpClient,
    ) {}

    rm(id: string): Observable<void> {
        return this.httpClient.delete(`/api/queue/${id}`).pipe(
            map(() => {}),
        );
    }

    mv(id: string, ma: MoveAction): Observable<void> {
        return this.httpClient.post(`/api/queue/${id}/${ma}`, undefined).pipe(
            map(() => {}),
        );
    }

    start(sk: StartKind.import, body: StartImport): Observable<void>
    start(sk: StartKind, body: any): Observable<void> {
        return this.httpClient.post(`/api/queue/start`, body, {
            headers: {
                'X-Command-Type': sk,
            },
        }).pipe(
            map(() => {}),
        );
    }
}

export enum MoveAction {
    up = 'up',
    down = 'down',
    bottom = 'bottom',
    top = 'top',
}

export enum StartKind {
    import = 'import',
}

export type StartImport = {
    path: string[];
    query?: string;
    library:  string;
    queries: string[];
    set: {};
    groupAlbums: boolean;
    flat: boolean;
    singleton: boolean;
    timid: boolean;
    asIs: boolean;
};
