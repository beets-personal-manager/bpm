import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ApiConfigService {
    constructor(
        private readonly httpClient: HttpClient,
    ) {}

    queries(): Observable<string[]> {
        return this.httpClient.get<string[]>(`/api/config/queries`);
    }
}
