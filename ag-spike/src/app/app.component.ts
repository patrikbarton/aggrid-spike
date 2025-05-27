// src/app/app.component.ts
import {Component, ChangeDetectionStrategy} from '@angular/core';
import {AgGridModule} from 'ag-grid-angular';
import {
    ColDef,
    ICellRendererParams,
    GridApi,
    GridReadyEvent,
    FirstDataRenderedEvent,
    GridOptions
} from 'ag-grid-community';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AgGridModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    private gridApi!: GridApi;

    columnDefs: ColDef[] = [
        {
            headerName: 'Photo',
            field: 'imageUrl',
            cellRenderer: (params: ICellRendererParams) => {
                return `<img src="${params.value}" style="height:32px;" />`;
            },
        },
        {field: 'id', headerName: 'ID'},
        {field: 'make', headerName: 'Make'},
        {field: 'model', headerName: 'Model'},
        {field: 'price', headerName: 'Price', type: 'numericColumn'},
        {field: 'value', headerName: 'Value', type: 'numericColumn'}
    ];
    rowData: any[] = [];
    gridOptions: GridOptions = {rowHeight: 50, defaultColDef: {resizable: true, sortable: true, filter: true}};

    onGridReady(e: GridReadyEvent) {
        this.gridApi = e.api;
    }

    onFirstDataRendered(e: FirstDataRenderedEvent) {
        e.api.sizeColumnsToFit();
    }

    runDataLoad(count = 5000) {
        const data = Array.from({length: count}, (_, i) => ({
            id: i + 1,
            make: ['Toyota', 'Ford', 'Porsche', 'BMW', 'Mercedes'][i % 5],
            model: ['A', 'B', 'C', 'D', 'E'][i % 5],
            price: Math.round(Math.random() * 100_0000),
            value: Number(Math.random().toFixed(4)),
            imageUrl: `assets/car-images/${['toyota', 'ford', 'porsche', 'bmw', 'mercedes'][i % 5]}.png`
        }));
        // ← THIS actually pushes the rows into the grid:
        this.rowData = data;
    }

    runDeltaUpdate(addCount = 1000, updateCount = 1000, removeCount = 1000) {
        const adds = Array.from({length: addCount}, (_, i) => ({
            id: this.rowData.length + i + 1,
            make: 'New', model: 'X', price: 0, value: 0, imageUrl: ''
        }));
        const updates = this.rowData.slice(0, updateCount)
            .map(r => ({...r, price: (r.price as number) + 1}));
        const removes = this.rowData.slice(-removeCount);

        this.gridApi.applyTransaction({add: adds, update: updates, remove: removes});

        // keep our local copy in sync
        const toRemove = new Set(removes.map(r => r.id));
        this.rowData = [
            ...this.rowData.filter(r => !toRemove.has(r.id)),
            ...adds
        ].map(r => updates.find(u => u.id === r.id) || r);
    }

    runSort(colId = 'price') {
        const colApi = (this.gridApi as any).getColumnApi();
        colApi.applyColumnState({
            state: [{colId, sort: 'asc'}],
            applyOrder: true
        });
    }

    runFilter(filterValue = 'Toyota') {
        this.gridApi.setGridOption('quickFilterText', filterValue);
    }

    async runScroll() {
        for (let i = 0; i < this.rowData.length; i += 1000) {
            this.gridApi.ensureIndexVisible(i, 'top');
            await new Promise(r => requestAnimationFrame(r));
        }
    }

    runGroup(colId = 'make') {
        this.columnDefs = this.columnDefs.map(c => ({
            ...c,
            rowGroup: c.field === colId
        }));
    }
}
