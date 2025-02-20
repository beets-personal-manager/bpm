import {inject, Injectable} from '@angular/core';
import {ApiMessagesService, EventTypes, MessageKinds} from './api/api-messages.service';
import {filter, map, Observable} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ConsoleService {
    private readonly isActive = inject(ApiMessagesService).messages(EventTypes.console).pipe(
        filter(msg => msg.kind === MessageKinds.start || msg.kind === MessageKinds.exit),
        map(msg => msg.kind === MessageKinds.start),
    );

    get isStarted(): Observable<boolean> {
        return this.isActive;
    }

    get isStopped(): Observable<boolean> {
        return this.isActive.pipe(
            map(v => !v),
        );
    }
}
