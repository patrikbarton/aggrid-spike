// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

// 1. import ModuleRegistry and the bundle you want
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// 2. register the modules _before_ bootstrapping
ModuleRegistry.registerModules([ AllCommunityModule ]);

bootstrapApplication(AppComponent)
    .catch(err => console.error(err));
