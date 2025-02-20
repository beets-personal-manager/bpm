import {Component, computed, inject, input, signal} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {TerminalKind, TerminalKinds} from '../console-terminal.directive';
import {toSignal} from '@angular/core/rxjs-interop';
import {ConsoleService} from '../../../../core/services/console.service';
import {catchError, EMPTY, finalize} from 'rxjs';
import {ApiConsoleService, InputKinds} from '../../../../core/services/api/api-console.service';
import {SnackbarService} from '../../../../core/services/snackbar.service';
import {EditorService} from '../../../../core/services/editor.service';

@Component({
    selector: 'app-console-terminal-input',
    imports: [
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
    ],
    templateUrl: './console-terminal-input.component.html',
    styleUrl: './console-terminal-input.component.scss',
    standalone: true,
})
export class ConsoleTerminalInputComponent {
    readonly value = signal('');
    readonly kind = input<TerminalKind>();
    readonly isVisible = computed(() => {
        const kind = this.kind();
        return !(kind === undefined || kind === TerminalKinds.stderr);
    });
    readonly inputValue = computed(() => {
        const value = this.value();
        if (!this.isVisible()) {
            return '';
        }
        return value;
    });

    private readonly isSubmitting = signal(false);
    private readonly isStopped = toSignal(inject(ConsoleService).isStopped, {initialValue: true});

    private readonly isEditor = toSignal(inject(EditorService).isEditor, {initialValue: false});

    readonly disabled = computed(() => {
        return [
            this.isStopped(),
            this.isSubmitting(),
            !this.isVisible(),
            this.isEditor(),
        ].some(v => v);
    });

    readonly buttonsDisabled = computed(() => {
        const disabled = this.disabled();
        const hasValue = this.inputValue();
        return disabled || !hasValue;
    });

    private readonly consoleService = inject(ApiConsoleService);
    private readonly snackbarService = inject(SnackbarService);

    submit() {
        if (this.disabled()) {
            return;
        }
        this.isSubmitting.set(true);
        this.consoleService.input(InputKinds.console, this.value()).pipe(
            catchError(() => {
                this.snackbarService.error('Failed to submit input.');
                return EMPTY;
            }),
            finalize(() => this.isSubmitting.set(false)),
        ).subscribe(() => this.value.set(''));
    }

    reset() {
        if (this.disabled()) {
            return;
        }
        this.value.set('');
    }
}
