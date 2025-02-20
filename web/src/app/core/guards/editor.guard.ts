import {CanActivateFn} from '@angular/router';
import {interval, map, switchMap, take, takeLast, takeUntil, timer} from 'rxjs';
import {inject} from '@angular/core';
import {EditorService} from '../services/editor.service';

export const editorGuard: CanActivateFn = () => {
    return inject(EditorService).isEditor.pipe(
        switchMap(v => timer(250).pipe(map(() => v))),
        take(1),
    );
};
