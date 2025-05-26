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
        {
            headerName: 'Photo',
            field:    'imageUrl',
            cellRenderer: params =>
                `<img src="${params.value}"
                      alt="Photo of car"
                      style="height:40px; width:auto; border-radius:4px">`,
            width:  80,
        },
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
        pagination: false,
        paginationPageSize: 100,
        rowHeight: 60,
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
        const data = Array.from({ length: count }, (_, i) => {
            // first grab the `make` and `model` into local vars
            const make  = this.makes[i % this.makes.length];
            const model = this.models[i % this.models.length];

            // then use that `make` when building your imageUrl
            return {
                id:    i + 1,
                make,
                model,
                price: Math.round(Math.random() * 100_000),
                value: Math.random().toFixed(4),
                imageUrl: `assets/car-images/${make.toLowerCase()}.png`
            };
        });
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
