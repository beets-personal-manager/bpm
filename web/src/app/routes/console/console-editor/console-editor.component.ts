import {Component, computed, inject} from '@angular/core';
import {EditorData, EditorService} from '../../../core/services/editor.service';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {filter, map, pairwise, startWith} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatCardModule} from '@angular/material/card';
import {MatTooltip} from "@angular/material/tooltip";
import {ToolbarSenderDirective} from "../../../core/directives/toolbar/toolbar-sender.directive";
import {ApiConsoleService, InputKinds} from '../../../core/services/api/api-console.service';
import { NavService } from '../../../core/services/nav.service';

@Component({
    selector: 'app-console-editor',
    imports: [
        MatCardModule,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        ReactiveFormsModule,
        MatTooltip,
        ToolbarSenderDirective,
    ],
    templateUrl: './console-editor.component.html',
    styleUrl: './console-editor.component.scss',
})
export class ConsoleEditorComponent {
    private readonly editorService = inject(EditorService);
    private readonly rawData = toSignal(this.editorService.data.pipe(
        filter(v => !!v),
        map(msg => ({
            controls: msg.data.map(data => Object.entries(data).map(([name, value]) => ({
                name,
                control: new FormControl(value),
                value,
            })).sort(({name: a}, {name: b}) => a.localeCompare(b))),
            filename: msg.filename,
        })),
    ), {initialValue: {controls: [], filename: ''}});

    readonly data = computed(() => this.rawData().controls);
    readonly form = computed(() => new FormGroup({
        data: new FormArray(this.rawData().controls.map(t => new FormArray(t.map(e => e.control)))),
    }));

    readonly isNotEditor = toSignal(this.editorService.isEditor.pipe(
        map(v => !v),
    ), {initialValue: true});

    private readonly consoleService = inject(ApiConsoleService);
    private readonly navService = inject(NavService);

    constructor() {
        this.editorService.isEditor.pipe(
            takeUntilDestroyed(),
            pairwise(),
            filter(([prev, curr]) => prev && !curr),
        ).subscribe(() => {
            this.navService.navRootGroup.navConsole.navConsoleConsole.activate();
        });
    }

    save() {
        this.consoleService.input(InputKinds.editor, this.getFormData()).subscribe();
    }

    private getFormData(): EditorData {
        return {
            filename: this.rawData().filename,
            data: this.rawData().controls.map(e => Object.fromEntries(e.map(v => [v.name, v.control.value]))),
        };
    }
}

type Data = {
    controls: {
        name: string;
        control: FormControl;
        value: any;
    }[][];
    filename: string;
};
