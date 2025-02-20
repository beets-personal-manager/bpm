import {Component, computed, input, Pipe, PipeTransform} from '@angular/core';
import {MatChipsModule} from '@angular/material/chips';
import {ExtensionTypes} from '../services/api/api-info.service';

@Pipe({
    name: 'extCount',
    standalone: true,
})
class ExtCountsPipe implements PipeTransform {
    transform(ext: string, counts: Record<string, number>): any {
        return counts[ext] ?? '';
    }
}

@Component({
    selector: 'app-type-chips',
    imports: [
        MatChipsModule,
        ExtCountsPipe,
    ],
    styles: [],
    standalone: true,
    template: `
        <mat-chip-set>
            @for (ext of extensions(); track ext) {
                <mat-chip disableRipple [highlighted]="false"><b>{{ ext }}:</b> {{ ext | extCount:counts() }}</mat-chip>
            }
        </mat-chip-set>
    `,
})
export class TypeChipsComponent {
    readonly types = input<ExtensionTypes>();

    readonly counts = computed(() =>
        Object.fromEntries(
            Object.entries(this.types() ?? {}).map(([key, value,]) => {
                if (key.startsWith('.')) {
                    key = key.slice(1);
                }
                return [key, value];
            }),
        ),
    );

    readonly extensions = computed(() => Object.keys(this.counts()));
}
