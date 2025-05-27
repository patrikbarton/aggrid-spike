// src/app/app.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import {
    ColDef,
    ICellRendererParams,
    GridApi,
    GridReadyEvent,
    FirstDataRenderedEvent,
    GridOptions,
    ModuleRegistry,
    AllCommunityModule
} from 'ag-grid-community';

// register all community modules once, before any grids are created:
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        AgGridModule
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    private gridApi!: GridApi;

    /** Rows currently in the grid */
    rowData: any[] = [];

    /** Holds the last run durations */
    metrics: Record<string, number> = {};

    // re-use these across all operations
    makes = ['Toyota', 'Ford', 'Porsche', 'BMW', 'Mercedes'];
    models = ['A', 'B', 'C', 'D', 'E'];

    // your load counts (unchanged)
    loadCounts = [
        10, 20, 100, 200,
        1_000, 50_000, 100_000,
        1_000_000, 5_000_000
    ];

    columnDefs: ColDef[] = [
        {
            headerName: 'Photo',
            field: 'imageUrl',
            width: 100,
            cellRenderer: (params: ICellRendererParams) =>
                `<img src="${params.value}" alt="Car" style="height:32px;" />`
        },
        { field: 'id',    headerName: 'ID',    width: 80 },
        { field: 'make',  headerName: 'Make',  flex: 1 },
        { field: 'model', headerName: 'Model', flex: 1 },
        {
            field: 'price',
            headerName: 'Price',
            flex: 1,
            type: 'numericColumn',
            filter: 'agNumberColumnFilter'
        },
        { field: 'value', headerName: 'Value', flex: 1, type: 'numericColumn' }
    ];

    gridOptions: GridOptions = {
        rowHeight: 50,
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true
        }
    };

    onGridReady(e: GridReadyEvent) {
        this.gridApi = e.api;
    }

    onFirstDataRendered(e: FirstDataRenderedEvent) {
        // finish measuring the initial render
        performance.mark('render-end');
        performance.measure('Initial Render Time', 'render-start', 'render-end');

        // auto-size to fit
        e.api.sizeColumnsToFit();

        this.captureMetrics();
    }

    runDataLoad(count: number) {
        performance.clearMarks();
        performance.clearMeasures();

        // 1) measure data generation
        performance.mark('gen-start');
        const data = Array.from({ length: count }, (_, i) => ({
            id:    i + 1,
            make:  this.makes[i % this.makes.length],
            model: this.models[i % this.models.length],
            price: Math.round(Math.random() * 100_0000),
            value: Math.random().toFixed(4),
            imageUrl: `assets/car-images/${this.makes[i % this.makes.length].toLowerCase()}.png`
        }));
        performance.mark('gen-end');
        performance.measure('Data Generation Time', 'gen-start', 'gen-end');

        // 2) measure binding
        performance.mark('set-start');
        this.gridApi.setGridOption('rowData', data);
        this.rowData = data;
        performance.mark('set-end');
        performance.measure('Data Binding Time', 'set-start', 'set-end');

        // 3) prepare to measure render; onFirstDataRendered will close it
        performance.mark('render-start');
    }

    runDeltaUpdate(addCount = 1_000, updateCount = 1_000, removeCount = 1_000) {
        performance.clearMarks();
        performance.clearMeasures();

        const adds = Array.from({ length: addCount }, (_, i) => ({
            id: this.rowData.length + i + 1,
            make: 'New', model: 'X', price: 0, value: 0, imageUrl: ''
        }));
        const updates = this.rowData.slice(0, updateCount).map(r => ({
            ...r,
            price: (r.price as number) + 1
        }));
        const removes = this.rowData.slice(-removeCount);

        performance.mark('delta-start');
        this.gridApi.applyTransaction({ add: adds, update: updates, remove: removes });
        performance.mark('delta-end');
        performance.measure('Delta Update Time', 'delta-start', 'delta-end');

        // keep local rowData in sync
        const toRemove = new Set(removes.map(r => r.id));
        this.rowData = [
            ...this.rowData.filter(r => !toRemove.has(r.id)),
            ...adds
        ].map(r => updates.find(u => u.id === r.id) || r);

        this.captureMetrics();
    }

    runSort(colId = 'price') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('sort-start');
        (this.gridApi as any).getColumnApi().applyColumnState({
            state: [{ colId, sort: 'asc' }],
            applyOrder: true
        });
        performance.mark('sort-end');
        performance.measure('Sort Time', 'sort-start', 'sort-end');

        this.captureMetrics();
    }

    runFilter(filterValue = 'Toyota') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('filter-start');
        this.gridApi.setGridOption('quickFilterText', filterValue);
        performance.mark('filter-end');
        performance.measure('Filter Time', 'filter-start', 'filter-end');

        this.captureMetrics();
    }

    async runScroll() {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('scroll-start');
        for (let i = 0; i < this.rowData.length; i += 1000) {
            this.gridApi.ensureIndexVisible(i, 'top');
            await new Promise(r => requestAnimationFrame(r));
        }
        performance.mark('scroll-end');
        performance.measure('Scroll Test Time', 'scroll-start', 'scroll-end');

        this.captureMetrics();
    }

    runGroup(colId = 'make') {
        performance.clearMarks();
        performance.clearMeasures();

        const defs = this.columnDefs.map(c => ({
            ...c,
            rowGroup: c.field === colId
        }));

        performance.mark('group-start');
        this.gridApi.setGridOption('columnDefs', defs);
        performance.mark('group-end');
        performance.measure('Grouping Time', 'group-start', 'group-end');

        this.captureMetrics();
    }

    /** Pull all performance.measure() entries into our metrics map */
    private captureMetrics() {
        performance.getEntriesByType('measure').forEach(m => {
            this.metrics[m.name] = m.duration;
        });
    }
}
