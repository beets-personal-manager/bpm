import {Component, computed, input, viewChild} from '@angular/core';
import {QueueMessageItem, QueueMessageItemKinds} from '../../../../core/services/api/api-messages.service';
import {StartImport} from '../../../../core/services/api/api-queue.service';
import {MatListModule} from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {MatFormField, MatFormFieldModule, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {KeyValuePipe} from '@angular/common';
import {DisableAllClickDirective} from '../../../../core/directives/disable-all-click.directive';
import {toObservable} from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-console-queue-import-view',
    imports: [
        MatCardModule,
        MatListModule,
        CdkTextareaAutosize,
        MatFormFieldModule,
        MatInputModule,
        KeyValuePipe,
        DisableAllClickDirective,
    ],
    templateUrl: './console-queue-import-view.component.html',
    styleUrl: './console-queue-import-view.component.scss'
})
export class ConsoleQueueImportViewComponent {
    readonly item = input.required<QueueMessageItem<StartImport, QueueMessageItemKinds.import>>();

    readonly path = computed(() => this.item().api.path);
    readonly library = computed(() => this.item().api.library);
    readonly query = computed(() => this.item().api.query);
    readonly queries = computed(() => this.item().api.queries);
    readonly set = computed(() => this.item().api.set);
    readonly groupAlbums = computed(() => this.item().api.groupAlbums);
    readonly flat = computed(() => this.item().api.flat);
    readonly singleton = computed(() => this.item().api.singleton);
    readonly timid = computed(() => this.item().api.timid);
    readonly asIs = computed(() => this.item().api.asIs);

    readonly hasSet = computed(() => Object.entries(this.set()).length > 0);
    readonly hasQueries = computed(() => this.queries().length > 0);
    readonly hasQuery = computed(() => (this.query() ?? undefined) !== undefined);
}
