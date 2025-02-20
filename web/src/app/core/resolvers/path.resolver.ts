import {Resolvable} from '../util/resolvable';
import {ActivatedRouteSnapshot, UrlSegment} from '@angular/router';

export const pathResolver = Resolvable(RouteToPath);

export function RouteToPath(route: ActivatedRouteSnapshot): string[] {
    return route.url.map((v: UrlSegment) => v.path).map(decodeURIComponent).map(v => v.trim()).filter(v => v);
}
