import {ActivatedRoute, ActivatedRouteSnapshot, Data} from '@angular/router';
import {combineLatest, map, Observable, shareReplay} from 'rxjs';

export function gatherRouteSnapshotData(snapshot: ActivatedRouteSnapshot): Data {
    function gatherData(rs: ActivatedRouteSnapshot|null): Data {
        return rs ? {
            ...rs.data,
            ...rs.children.reduce((a, c) => ({...a, ...gatherData(c)}), {}),
        } : {};
    }
    return gatherData(snapshot.root);
}

export function gatherRouteData(route: ActivatedRoute): Observable<Data> {
    function gatherData(r: ActivatedRoute|null): Observable<Data>[] {
        return r ? [
            r.data,
            ...r.children.reduce((a, c) => [...a, ...gatherData(c)], Array()),
        ] : [];
    }

    return combineLatest(gatherData(route.root)).pipe(
        map(a => a.reduce((acc, curr) => ({
            ...acc,
            ...curr,
        }), {})),
        shareReplay(1),
    );
}
