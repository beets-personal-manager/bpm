import {inject, Injectable} from '@angular/core';
import {ApiMessagesService, EditorKinds, EditorMessages, EventTypes} from './api/api-messages.service';
import {filter, map, shareReplay, startWith} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class EditorService {
    readonly isEditor = inject(ApiMessagesService).messages(EventTypes.editor).pipe(
        map(isEditor),
        startWith(false),
        shareReplay(1),
        takeUntilDestroyed(),
    );

    readonly data = inject(ApiMessagesService).messages(EventTypes.editor).pipe(
        map(msg => isEditor(msg) ? {
            filename: msg.filename,
            data: msg.data,
        } : undefined),
        shareReplay(1),
        takeUntilDestroyed(),
    );
}

function isEditor(msg: EditorMessages): boolean {
    if (msg.editor === EditorKinds.start) {
        return !(msg.end ?? false);
    }
    return false;
}

export type EditorData = {
    filename: string;
    data: Record<string, any>[];
};
