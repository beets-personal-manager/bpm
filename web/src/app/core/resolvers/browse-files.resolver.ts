import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {ApiBrowseService} from '../services/api/api-browse.service';
import {RouteToPath} from './path.resolver';
import {BrowseService} from '../services/browse.service';
import {of} from 'rxjs';

export const browseFilesResolver = Resolvable(route => of(inject(BrowseService).loadFolder(RouteToPath(route).join('/'))));
