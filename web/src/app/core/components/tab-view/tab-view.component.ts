import {Component, computed, inject} from '@angular/core';
import {MatTabsModule} from '@angular/material/tabs';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {NavGroup, NavService} from '../../services/nav.service';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {Resolver} from '../../util/resolvable';
import {newUUID} from '../../util/uuid';
import {filter, map, merge, switchMap, combineLatest} from 'rxjs';

export const TAB_NAV_RESOLVER = newUUID();

@Component({
    selector: 'app-tab-view',
    imports: [
        MatTabsModule,
        RouterLink,
        CommonModule,
        RouterOutlet,
        RouterLinkActive,
    ],
    templateUrl: './tab-view.component.html',
    styleUrl: './tab-view.component.scss',
    standalone: true,
})
export class TabViewComponent {
    readonly links = toSignal(inject(ActivatedRoute).data.pipe(
        filter(data => TAB_NAV_RESOLVER in data),
        switchMap(data => (data[TAB_NAV_RESOLVER] as Resolver<NavGroup>).resolve(data)),
    ), {initialValue: new NavGroup([])});

    readonly active = toSignal(toObservable(this.links).pipe(
        switchMap(links => merge(...[...links].map(link => link.isActive$.pipe(
            filter(v => v),
            map(() => link.link),
        )))),
    ));

    readonly disabled = toSignal(toObservable(this.links).pipe(
        switchMap(links => combineLatest([...links].map(l => l.disabled$))),
    ), {initialValue: []});
}
