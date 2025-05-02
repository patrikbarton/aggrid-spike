import { Component } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  columnDefs: ColDef[] = [
    { field: 'id', sortable: true, filter: true },
    { field: 'make', sortable: true, filter: true },
    { field: 'model', sortable: true, filter: true },
    { field: 'price', sortable: true, filter: true, type: 'numericColumn' },
    { field: 'value', sortable: true, filter: true, type: 'numericColumn' }
  ];

  rowData: any[] = [];
  gridOptions: GridOptions = {
    defaultColDef: {
      resizable: true
    },
    pagination: true,
    paginationPageSize: 100,
    rowBuffer: 100
  };

  private makes = ['Toyota','Ford','Porsche','BMW','Mercedes'];
  private models = ['A','B','C','D','E'];

  loadData(count: number) {
    console.time(`Generating ${count}`);
    const data = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      make: this.makes[i % this.makes.length],
      model: this.models[i % this.models.length],
      price: Math.round(Math.random() * 100_000),
      value: Math.random()
    }));
    console.timeEnd(`Generating ${count}`);

    console.time(`Setting ${count}`);
    this.rowData = data;
    console.timeEnd(`Setting ${count}`);
  }

  onFirstDataRendered() {
    console.log('First batch rendered');
  }
}
