import {Component, OnInit} from '@angular/core';
import {ColDef, GridOptions, GridApi} from 'ag-grid-community';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
    private gridApi!: GridApi;

    // column definitions
    columnDefs: ColDef[] = [
        {field: 'id', headerName: 'ID', sortable: true, filter: true, width: 100},
        {field: 'make', headerName: 'Make', sortable: true, filter: true},
        {field: 'model', headerName: 'Model', sortable: true, filter: true},
        {field: 'price', headerName: 'Price', sortable: true, filter: true, type: 'numericColumn'},
        {field: 'value', headerName: 'Value', sortable: true, filter: true, type: 'numericColumn'}
    ];

    // data rows
    rowData: any[] = [];

    // grid options
    gridOptions: GridOptions = {
        defaultColDef: { resizable: true },
        pagination: true,
        paginationPageSize: 100,
        rowBuffer: 100,
        animateRows: true,
        onGridReady: params => {
            // remember the API so Quick-Filter still works
            this.gridApi = params.api;
            // size columns to fit the grid width
            params.api.sizeColumnsToFit();
        },
        onFirstDataRendered: params => {
            // also size-to-fit after the first batch arrives
            params.api.sizeColumnsToFit();
        }
    };


    // sample data pools
    private makes = ['Toyota', 'Ford', 'Porsche', 'BMW', 'Mercedes'];
    private models = ['A', 'B', 'C', 'D', 'E'];

    // generate & load N rows
    loadData(count: number) {
        console.time(`Generating ${count}`);
        const data = Array.from({length: count}, (_, i) => ({
            id: i + 1,
            make: this.makes[i % this.makes.length],
            model: this.models[i % this.models.length],
            price: Math.round(Math.random() * 100_000),
            value: Math.random().toFixed(4)
        }));
        console.timeEnd(`Generating ${count}`);

        console.time(`Setting ${count}`);
        this.rowData = data;
        console.timeEnd(`Setting ${count}`);
    }

    // AG Grid event hooks
    onFirstDataRendered() {
        console.log('First batch rendered');
    }

    onGridReady(params: any) {
        this.gridApi = params.api;
    }

    // quick-filter handler
    onQuickFilter(event: Event) {
        const filterText = (event.target as HTMLInputElement).value;
        this.gridApi.setQuickFilter(filterText);
    }
    ngOnInit() {
        this.loadData(50000);
    }
}
