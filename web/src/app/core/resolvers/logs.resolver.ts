import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {NavService} from '../services/nav.service';
import {ApiLogsService} from '../services/api/api-logs.service';

export const logsResolver = Resolvable(() => inject(ApiLogsService).logs());
