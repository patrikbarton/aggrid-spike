// src/main.ts
import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';

import {ModuleRegistry, AllCommunityModule} from 'ag-grid-community';
import {provideCharts, withDefaultRegisterables} from 'ng2-charts';

import { Chart, registerables } from 'chart.js';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';

Chart.register(...registerables, DataLabelsPlugin);

ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, {
    providers: [provideCharts(withDefaultRegisterables())]
})
    .catch(err => console.error(err));
