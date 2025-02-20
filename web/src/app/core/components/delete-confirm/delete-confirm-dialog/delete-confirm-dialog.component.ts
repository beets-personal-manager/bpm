import {Component, inject, TemplateRef} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {NgTemplateOutlet} from '@angular/common';

@Component({
    selector: 'app-logs-toolbar-delete-dialog',
    imports: [
        MatDialogModule,
        MatButtonModule,
        NgTemplateOutlet,
    ],
    templateUrl: './delete-confirm-dialog.component.html',
    styleUrls: [
        './delete-confirm-dialog.component.scss',
        '../delete-confirm.component.scss',
    ],
    standalone: true,
})
export class DeleteConfirmDialogComponent<T> {
    private readonly dialogRef = inject(MatDialogRef<DeleteConfirmDialogComponent<T>>);
    readonly selected!: T[];
    readonly dataTable!: TemplateRef<TemplateRef<any>>;

    constructor() {
        ({
            selected: this.selected,
            dataTable: this.dataTable,
        } = inject<LogsToolbarDeleteDialogData<T>>(MAT_DIALOG_DATA));
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

export type LogsToolbarDeleteDialogData<T> = {
    selected: T[];
    dataTable: TemplateRef<any>;
};
