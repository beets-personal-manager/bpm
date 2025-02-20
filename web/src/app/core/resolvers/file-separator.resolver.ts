import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {ApiBrowseService} from '../services/api/api-browse.service';

export const fileSeparatorResolver = Resolvable(() => inject(ApiBrowseService).fileSeparator)
