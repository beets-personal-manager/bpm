import {newUUID} from './uuid';
import {ActivatedRoute, Data, ResolveFn} from '@angular/router';
import {filter, isObservable, map, Observable, of, tap} from 'rxjs';

export function Resolvable<T>(fn: ResolveFn<T>): Resolver<T> {
    const key = newUUID();
    const obj = {[key]: fn};
    Object.defineProperty(obj, 'resolve', {
        enumerable: false,
        writable: false,
        value: (data: Observable<Data>|Data): Observable<T> => getData(data).pipe(
            map(d => d as Data),
            filter(d => key in d),
            map(d => d[key] as T),
        ),
    });
    return obj as unknown as Resolver<T>;
}

export interface Resolver<T> {
    resolve(data: Observable<Data>|Data): Observable<T>;
}

function getData(data: Observable<Data>|Data): Observable<Data> {
    if (isObservable(data)) {
        return data as Observable<Data>;
    }
    return of(data);
}
