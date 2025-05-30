import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AgGridModule } from 'ag-grid-angular';

import { AppComponent } from './app.component';

import { ChartsModule, ThemeService } from 'ng2-charts';  // ← import ThemeService


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ChartsModule,
    AgGridModule.withComponents([]),
  ],
  providers: [ThemeService],
  bootstrap: [AppComponent]
})
export class AppModule { }
