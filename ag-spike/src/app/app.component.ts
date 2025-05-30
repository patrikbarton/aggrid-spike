// src/app/app.component.ts
import {Component, ChangeDetectionStrategy, ViewChild} from '@angular/core';
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
import { BaseChartDirective } from 'ng2-charts';
import {ChartConfiguration, ChartOptions, ChartType} from "chart.js";
import DataLabelsPlugin from "chartjs-plugin-datalabels";

// register only the community modules (enterprise modules auto-registered by the import above)
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [ CommonModule, AgGridModule, BaseChartDirective ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // tell ng2-charts which plugins to use
    public barChartPlugins = [ DataLabelsPlugin ];

    public barChartType: ChartType = 'bar';
    public barChartData: ChartConfiguration<'bar'>['data'] = {
        labels: [],            // metric names populated at runtime
        datasets: [
            {
                data: [],          // metric values populated at runtime
                label: 'ms',
                datalabels: {
                    anchor: 'end',
                    align: 'start',
                    formatter: (v: number) => v.toFixed(2)
                }
            }
        ]
    };
    public barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            // enable and configure the datalabels plugin
            datalabels: {
                color: 'black',
                font: { weight: 'bold' },
                anchor: 'end',
                align: 'start',
                formatter: (v: number) => v.toFixed(2) + ' ms'
            },
            legend: { display: false }
        },
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Duration (ms)' } },
            x: { title: { display: true, text: 'Metric' } }
        }
    };

    private captureMetrics() {
        performance.getEntriesByType('measure').forEach(m => {
            this.metrics[m.name] = m.duration;
        });        // then update the chart:
        const entries = Object.entries(this.metrics);
        this.barChartData.labels = entries.map(([k]) => k);
        this.barChartData.datasets[0].data = entries.map(([_, v]) => +v.toFixed(2));
        this.chart?.update();  // re-draw with labels
    }





    //Grid and Data gathering
    private gridApi!: GridApi;

    /** Rows currently in the grid */
    rowData: any[] = [];

    /** Holds the last run durations */
    metrics: Record<string, number> = {};

    // reuse these across all operations
    brands = ['Toyota','Ford','Porsche','BMW','Mercedes'];
    models = ['A','B','C','D','E'];

    // your load counts
    loadCounts = [10,20,100,200,1_000,50_000,100_000,1_000_000,5_000_000];

    columnDefs: ColDef[] = [
        {
            headerName: 'Photo',
            field: 'imageUrl',
            width: 100,
            cellRenderer: (params: ICellRendererParams) =>
                `<img src="${params.value}" alt="Car" style="height:32px;" />`
        },
        { field: 'id',     headerName: 'ID',     width: 80},
        { field: 'make',   headerName: 'Brand',  flex: 1},
        { field: 'model',  headerName: 'Model',  flex: 1 },
        {
            field: 'price',
            headerName: 'Price',
            flex: 1,
            type: 'numericColumn',
            filter: 'agNumberColumnFilter'
        },
        { field: 'value',  headerName: 'Value',  flex: 1, type: 'numericColumn' }
    ];

    gridOptions: GridOptions = {
        // identify rows by id so applyTransaction/remove/update will work
        getRowId: params => params.data.id,
        rowHeight: 50,

        //for syncronous loading
        suppressRowVirtualisation: true,
        rowModelType: 'clientSide',

        //themes etc
        theme: 'legacy',
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true
        },
        // show the drop-zone for grouping
        rowGroupPanelShow: 'always',
        // display groups in their own columns
        groupDisplayType: 'multipleColumns',
        animateRows: true
    };

    onGridReady(e: GridReadyEvent) {
        this.gridApi = e.api;
    }

    onFirstDataRendered(e: FirstDataRenderedEvent) {
        performance.mark('render-end');
        performance.measure('Initial Render Time','render-start','render-end');
        e.api.sizeColumnsToFit();
        this.captureMetrics();
    }

    runDataLoad(count: number) {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('gen-start');
        const data = Array.from({ length: count }, (_, i) => ({
            id:    i + 1,
            make:  this.brands[i % this.brands.length],
            model: this.models[i % this.models.length],
            price: Math.round(Math.random() * 100_0000),
            value: Math.random().toFixed(4),
            imageUrl: `assets/car-images/${this.brands[i % this.brands.length].toLowerCase()}.png`
        }));
        performance.mark('gen-end');
        performance.measure('Data Generation Time','gen-start','gen-end');

        performance.mark('set-start');
        this.gridApi.setGridOption('rowData', data);
        this.rowData = data;
        performance.mark('set-end');
        performance.measure('Data Binding Time','set-start','set-end');

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
        performance.measure('Delta Update Time','delta-start','delta-end');

        const toRemove = new Set(removes.map(r => r.id));
        this.rowData = [
            ...this.rowData.filter(r => !toRemove.has(r.id)),
            ...adds
        ].map(r => updates.find(u => u.id === r.id) || r);

        this.captureMetrics();
    }

    runSort(colId: string = 'price') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('sort-start');
        this.gridApi.applyColumnState({
            state: [{ colId, sort: 'asc' }],
            applyOrder: true
        });
        performance.mark('sort-end');
        performance.measure('Sort Time','sort-start','sort-end');

        this.captureMetrics();
    }

    runFilter(filterValue = 'Toyota') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('filter-start');
        this.gridApi.setGridOption('quickFilterText', filterValue);
        performance.mark('filter-end');
        performance.measure('Filter Time','filter-start','filter-end');

        this.captureMetrics();
    }

    async runScroll() {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('scroll-start');
        for (let i = 0; i < this.rowData.length; i += 1000) {
            this.gridApi.ensureIndexVisible(i,'top');
            await new Promise(r => requestAnimationFrame(r));
        }
        performance.mark('scroll-end');
        performance.measure('Scroll Test Time','scroll-start','scroll-end');

        this.captureMetrics();
    }

    runGroup(colId: string = 'make') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('group-start');
        // group (and hide) the Brand column
        this.gridApi.applyColumnState({
            state: [{ colId, rowGroup: true, hide: true }],
            applyOrder: false
        });
        performance.mark('group-end');
        performance.measure('Grouping Time','group-start','group-end');

        this.captureMetrics();
    }

//     /** Pull all performance.measure() entries into our metrics map */
//     private captureMetrics() {
//         performance.getEntriesByType('measure').forEach(m => {
//             this.metrics[m.name] = m.duration;
//         });
//     }
 }
