// src/main.ts
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { bootstrapApplication } from '@angular/platform-browser';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AppComponent } from './app/app.component';

// register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent);
