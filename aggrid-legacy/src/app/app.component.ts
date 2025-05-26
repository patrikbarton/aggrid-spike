import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
    ColDef,
    GridApi,
    GridReadyEvent
} from 'ag-grid-community';
import { FirstDataRenderedEvent } from 'ag-grid-community/dist/lib/events';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    private gridApi!: GridApi;

    rowData: any[] = [];
    columnDefs: ColDef[] = [
        {
            headerName: 'Photo',
            field: 'imageUrl',
            cellRenderer: params =>
                `<img
           src="${params.value}"
           alt="Photo"
           style="height:40px; width:60%; border-radius:4px"
         />`
        },
        { field: 'id',    headerName: 'ID' },
        { field: 'make',  headerName: 'Make' },
        { field: 'model', headerName: 'Model' },
        { field: 'price', headerName: 'Price', type: 'numericColumn' },
        { field: 'value', headerName: 'Value', type: 'numericColumn' }
    ];

    gridOptions = {
        rowHeight: 50,
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true,
        }
    };

    /** Holds the last run durations */
    metrics: Record<string, number> = {};

    private makes  = ['Toyota','Ford','Porsche','BMW','Mercedes'];
    private models = ['A','B','C','D','E'];

    onGridReady(event: GridReadyEvent) {
        this.gridApi = event.api;
    }

    // 1) full load: generate → setRowData → firstDataRendered
    runDataLoad(count: number) {
        performance.clearMarks();
        performance.clearMeasures();

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
        performance.measure(
            'Data Generation Time',
            'gen-start',
            'gen-end'
        );

        performance.mark('set-start');
        this.gridApi.setRowData(data);
        performance.mark('set-end');
        performance.measure(
            'Data Binding Time',
            'set-start',
            'set-end'
        );

        performance.mark('render-start');
        // render-end is captured in onFirstDataRendered
    }

    onFirstDataRendered(event: FirstDataRenderedEvent) {
        performance.mark('render-end');
        performance.measure(
            'Initial Render Time',
            'render-start',
            'render-end'
        );
        this.captureMetrics();
    }

    // 2) delta updates (legacy API)
    runDeltaUpdate(addCount = 1000, updateCount = 1000, removeCount = 1000) {
        performance.clearMarks();
        performance.clearMeasures();

        const adds = Array.from({ length: addCount }, (_, i) => ({
            id: this.rowData.length + i + 1,
            make: 'New', model: 'X', price: 0, value: 0, imageUrl: ''
        }));
        const updates = this.rowData.slice(0, updateCount).map(r => ({ ...r, price: r.price + 1 }));
        const removes = this.rowData.slice(-removeCount);

        performance.mark('delta-start');
        this.gridApi.updateRowData({ add: adds, update: updates, remove: removes });
        performance.mark('delta-end');
        performance.measure(
            'Delta Update Time',
            'delta-start',
            'delta-end'
        );

        this.captureMetrics();
    }

    // 3) sort via legacy setSortModel
    runSort(colId = 'price') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('sort-start');
        this.gridApi.setSortModel([{ colId, sort: 'asc' }]);
        performance.mark('sort-end');
        performance.measure(
            'Sort Time',
            'sort-start',
            'sort-end'
        );

        this.captureMetrics();
    }

    // 4) quick filter
    runFilter(filterValue = 'Toyota') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('filter-start');
        this.gridApi.setQuickFilter(filterValue);
        performance.mark('filter-end');
        performance.measure(
            'Filter Time',
            'filter-start',
            'filter-end'
        );

        this.captureMetrics();
    }

    // 5) scroll test (frame‐by‐frame)
    async runScroll() {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('scroll-start');
        for (let i = 0; i < this.rowData.length; i += 1000) {
            this.gridApi.ensureIndexVisible(i, 'top');
            // wait one frame
            await new Promise(r => requestAnimationFrame(r));
        }
        performance.mark('scroll-end');
        performance.measure(
            'Scroll Test Time',
            'scroll-start',
            'scroll-end'
        );

        this.captureMetrics();
    }

    // 6) grouping
    runGroup(colId = 'make') {
        performance.clearMarks();
        performance.clearMeasures();

        // re-create columnDefs with rowGroup flag
        const defs = this.columnDefs.map(c => ({
            ...c,
            rowGroup: c.field === colId
        }));

        performance.mark('group-start');
        this.gridApi.setColumnDefs(defs);
        performance.mark('group-end');
        performance.measure(
            'Grouping Time',
            'group-start',
            'group-end'
        );

        this.captureMetrics();
    }

    private captureMetrics() {
        performance.getEntriesByType('measure').forEach(m => {
            this.metrics[m.name] = m.duration;
        });
    }
}
