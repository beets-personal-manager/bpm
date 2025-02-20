import {Component, inject, signal} from '@angular/core';
import {interval, startWith, switchMap} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {StatsCardComponent, StatsCardData} from './stats-card/stats-card.component';
import prettyBytes from "pretty-bytes";
import {HumanizeDuration, HumanizeDurationLanguage} from 'humanize-duration-ts';
import {AllStats, ApiInfoService, FileStats} from '../../core/services/api/api-info.service';

@Component({
    selector: 'app-stats',
    imports: [
        StatsCardComponent,
    ],
    templateUrl: './stats.component.html',
    styleUrl: './stats.component.scss',
    standalone: true,
})
export class StatsComponent {
    readonly beets = signal<StatsCardData>({
        data: [],
    });
    readonly imports = signal<StatsCardData>({
        data: [],
    });
    readonly library = signal<StatsCardData>({
        data: [],
    });

    private readonly humanizer = new HumanizeDuration(new HumanizeDurationLanguage());

    constructor() {
        const infoService = inject(ApiInfoService);
        interval(1000 * 60).pipe(
            startWith(0),
            takeUntilDestroyed(),
            switchMap(() => infoService.all()),
        ).subscribe(stats => this.setStats(stats));

        this.humanizer.addLanguage('go', {
            y: () => "y",
            mo: () => "mo",
            w: () => "w",
            d: () => "d",
            h: () => "h",
            m: () => "m",
            s: () => "s",
            ms: () => "ms",
            decimal: '.',
        });
        this.humanizer.setOptions({
            language: 'go',
            spacer: '',
            round: true,
            delimiter: '',
        });
    }

    private humanizeDuration(d: number): string {
        return this.humanizer.humanize(d*1000);
    }

    private setStats(stats: AllStats) {
        this.library.set(transformFileStats(stats.library));
        this.imports.set(transformFileStats(stats.imports));

        this.beets.set({
            data: [
                ['Tracks', `${stats.beets.tracks}`],
                ['Albums', `${stats.beets.albums}`],
                ['Artists', `${stats.beets.artists}`],
                ['Album Artists', `${stats.beets.albumArtists}`],
                ['Duration', this.humanizeDuration(stats.beets.time)],
                ['Size', prettyBytes(stats.beets.size)],
            ],
        });
    }
}

function transformFileStats(fs: FileStats): StatsCardData {
    return {
        data: [
            ['Folders', `${fs.folders}`] as [string, string],
            ['Files', `${fs.files}`] as [string, string],
        ].sort((a, b) => a[0].localeCompare(b[0])),
        table: {
            headers: ['Extensions', 'Count'],
            data: Object
                .entries(fs?.types ?? {})
                .sort((a, b) => a[0].localeCompare(b[0])),
        },
    };
}
