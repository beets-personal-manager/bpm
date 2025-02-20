import {Pipe, PipeTransform} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, defaultIfEmpty, EMPTY, fromEvent, map, Observable, of, switchMap, take, tap} from 'rxjs';

@Pipe({
    name: 'albumArtUrl',
})
export class AlbumArtUrlPipe implements PipeTransform {
    constructor(
        private readonly http: HttpClient,
    ) { }

    transform(id: number): Observable<AlbumArt> {
        return this.http.get(`/api/library/albumart/${id}`, {
            responseType: 'blob',
        }).pipe(
            switchMap(blob => {
                const reader = new FileReader();
                const o = fromEvent(reader, 'load').pipe(
                    take(1),
                    map(() => reader.result),
                );
                reader.readAsDataURL(blob);
                return o;
            }),
            map(src => ({ok: true, src})),
            catchError(() => {
                return EMPTY;
            }),
            defaultIfEmpty({ok: false, src: ''}),
        );
    }
}

export type AlbumArt = {
    ok: boolean;
    src: any;
};
