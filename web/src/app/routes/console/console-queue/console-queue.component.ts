import {Component, inject} from '@angular/core';
import {
    ApiMessagesService,
    EventTypes,
    QueueMessageItem,
    QueueMessageItemKinds
} from '../../../core/services/api/api-messages.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {map} from 'rxjs';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {DatePipe} from '@angular/common';
import {MatDividerModule} from '@angular/material/divider';
import {ApiQueueService, MoveAction, StartImport} from '../../../core/services/api/api-queue.service';
import {ConsoleQueueImportViewComponent} from './console-queue-import-view/console-queue-import-view.component';
import {MatCardModule} from '@angular/material/card';
import {ConsoleService} from '../../../core/services/console.service';
import {ApiConsoleService} from '../../../core/services/api/api-console.service';

@Component({
    selector: 'app-console-terminal-queue',
    imports: [
        MatExpansionModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        DatePipe,
        MatDividerModule,
        ConsoleQueueImportViewComponent,
        MatCardModule,
    ],
    templateUrl: './console-queue.component.html',
    styleUrl: './console-queue.component.scss',
    standalone: true,
})
export class ConsoleQueueComponent {
    private readonly queueMessages = inject(ApiMessagesService).messages(EventTypes.queue);
    readonly queue = toSignal(this.queueMessages.pipe(
        map(q => q.items),
        map(q => q.filter(e => !e.running)),
    ), {initialValue: []});
    readonly running = toSignal(this.queueMessages.pipe(
        map(q => q.items),
        map(q => q.filter(e => e.running)),
    ), {initialValue: []});
    readonly noItems = toSignal(this.queueMessages.pipe(
        map(q => q.items.length === 0),
    ), {initialValue: true});

    private readonly queueService = inject(ApiQueueService);
    private readonly consoleService = inject(ApiConsoleService);

    moveUp(id: string) {
        this.queueService.mv(id, MoveAction.up).subscribe();
    }

    moveDown(id: string) {
        this.queueService.mv(id, MoveAction.down).subscribe();
    }

    moveTop(id: string) {
        this.queueService.mv(id, MoveAction.top).subscribe();
    }

    moveBottom(id: string) {
        this.queueService.mv(id, MoveAction.bottom).subscribe();
    }

    remove(id: string) {
        this.queueService.rm(id).subscribe();
    }

    stopConsole() {
        this.consoleService.stop().subscribe();
    }

    asImport = asKind<QueueMessageItem<StartImport, QueueMessageItemKinds.import>>;
}

function asKind<T>(kind: any): T {
    return kind as T;
}
