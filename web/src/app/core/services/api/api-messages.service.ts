import {DestroyRef, Inject, Injectable, InjectionToken, NgZone, Optional} from '@angular/core';
import {
    EMPTY,
    filter, interval,
    map,
    NEVER,
    Observable, of,
    refCount,
    repeat,
    ReplaySubject,
    retry, share,
    shareReplay,
    switchMap, timer
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {EditorService} from '../editor.service';
import {StartImport} from './api-queue.service';

export const SOCKET_RECONNECT_INTERVAL = new InjectionToken<number>('SOCKET_RECONNECT_INTERVAL', {factory: () => 1000})

@Injectable({
    providedIn: 'root',
})
export class ApiMessagesService {
    private readonly events$ = new Map<string, Observable<BaseMessage<any>>>();

    constructor(
        zone: NgZone,
        destroyRef: DestroyRef,
        @Optional() @Inject(SOCKET_RECONNECT_INTERVAL) socketReconnectInterval: number,
    ) {
        const messages = new Observable<Event>(subscriber => {
            const messages = new EventSource('/api/messages');
            subscriber.add(() => messages.close());
            messages.onerror = err => {
                console.error(err);
                zone.run(() => subscriber.error(err));
            };

            eventTypes.forEach(ev => {
                messages.addEventListener(ev, ({type: name, data: raw}) => {
                    const data = JSON.parse(raw);
                    zone.run(() => subscriber.next({name, data}));
                });
            });

            return () => messages.close();
        }).pipe(
            share({
                connector: () => new ReplaySubject<Event>(),
                resetOnError: () => timer(socketReconnectInterval).pipe(takeUntilDestroyed(destroyRef)),
                resetOnComplete: () => timer(socketReconnectInterval).pipe(takeUntilDestroyed(destroyRef)),
                resetOnRefCountZero: () => of(null).pipe(takeUntilDestroyed(destroyRef)),
            }),
            takeUntilDestroyed(),
        );

        eventTypes.forEach(ev => {
            this.events$.set(ev, messages.pipe(
                takeUntilDestroyed(),
                filter(e => e.name === ev),
                map(e => e.data),
            ));
        });
    }

    messages(name: EventTypes.console): Observable<ConsoleMessage>
    messages(name: EventTypes.editor): Observable<EditorMessages>
    messages(name: EventTypes.queue): Observable<QueueMessage>
    messages(name: EventType): Observable<BaseMessage<any>> {
        if (!this.events$.has(name)) {
            return NEVER;
        }
        return this.events$.get(name)!;
    }
}

type Event = {
    name: string;
    data: BaseMessage<any>;
};

export type EventType = keyof typeof EventTypes;

export enum EventTypes {
    queue = 'queue',
    editor = 'editor',
    console = 'console',
}

const eventTypes = [
    EventTypes.queue,
    EventTypes.editor,
    EventTypes.console,
];

export enum MessageKinds {
    start = 'start',
    exit = 'exit',
    stdio = 'stdio',
    editor = 'editor',
    queue = 'queue',
}

export type MessageKind = keyof typeof MessageKinds;

export type BaseMessage<T extends MessageKind> = {
    time: string;
    kind: T;
};

export type StartMessage = BaseMessage<MessageKinds.start>;

export type ExitMessage = BaseMessage<MessageKinds.exit> & {
    code: number;
};

export type StdioKind = 'stdout'|'stderr'|'stdin';

export enum StdioKinds {
    stdout = 'stdout',
    stderr = 'stderr',
    stdin = 'stdin',
}

export type ConsoleMessage = StartMessage | ExitMessage | StdioMessage<StdioKinds>;

export type StdioMessage<T extends StdioKinds> = BaseMessage<MessageKinds.stdio> & {
    stdio: T;
    data: string;
};
export type StdoutMessage = StdioMessage<StdioKinds.stdout>;
export type StderrMessage = StdioMessage<StdioKinds.stderr>;
export type StdinMessage = StdioMessage<StdioKinds.stdin>;

export type QueueMessage = BaseMessage<MessageKinds.queue> & {
    items: QueueMessageItems[];
};

export enum QueueMessageItemKinds {
    import = 'import',
}

export type QueueMessageItemKind = keyof typeof QueueMessageItemKinds;

export type QueueMessageItem<T, K extends QueueMessageItemKind> = {
    api: T;
    kind: K;
    id: string;
    time: string;
    running: boolean;
};

export type QueueMessageItems = QueueMessageItem<StartImport, QueueMessageItemKinds.import>;

export enum EditorKinds {
    start = 'start',
    input = 'input',
}

export type EditorKind = keyof typeof EditorKinds;

export type EditorMessage<T extends EditorKind> = BaseMessage<MessageKinds.editor> & {
    editor: T;
    filename: string;
    data: Record<string, any>[];
};

export type EditorStart = EditorMessage<EditorKinds.start> & {
    end?: EditorInput;
};

export type EditorInput = EditorMessage<EditorKinds.input> & {
    failed: boolean;
};

export type EditorMessages = EditorStart | EditorInput;
