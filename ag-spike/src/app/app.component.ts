// src/app/app.component.ts
import {Component, ChangeDetectionStrategy, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AgGridModule} from 'ag-grid-angular';
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
import {BaseChartDirective} from 'ng2-charts';
import {ChartConfiguration, ChartOptions, ChartType} from 'chart.js';
import DataLabelsPlugin from 'chartjs-plugin-datalabels';

// Register community modules for ag-grid
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
    selector: 'app-root',          // Root component selector
    standalone: true,             // Enables standalone component
    imports: [CommonModule, AgGridModule, BaseChartDirective],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush  // Optimize change detection
})
export class AppComponent {
    // Access the chart directive in the template
    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    // Plugins to use with ng2-charts (here: DataLabels)
    public barChartPlugins = [DataLabelsPlugin];

    // Chart type: bar chart
    public barChartType: ChartType = 'bar';

    // Chart data structure (labels and datasets populated at runtime)
    public barChartData: ChartConfiguration<'bar'>['data'] = {
        labels: [],             // X-axis labels (metric names)
        datasets: [
            {
                data: [],           // Y-axis values (metric durations)
                label: 'ms',        // Dataset label (milliseconds)
                datalabels: {
                    anchor: 'end',
                    align: 'start',
                    formatter: (v: number) => v.toFixed(2) // Format numbers to 2 decimals
                }
            }
        ]
    };

    // Chart configuration options
    public barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            // DataLabels plugin configuration
            datalabels: {
                color: 'black',
                font: {weight: 'bold'},
                anchor: 'end',
                align: 'start',
                formatter: (v: number) => v.toFixed(2) + ' ms'
            },
            legend: {display: false}  // Hide legend
        },
        scales: {
            y: {                      // Y-axis settings
                beginAtZero: true,
                title: {display: true, text: 'Duration (ms)'}
            },
            x: {                      // X-axis settings
                title: {display: true, text: 'Metric'}
            }
        }
    };

    // Store performance metrics by name
    metrics: Record<string, number> = {};

    // Grid API reference (set when grid initializes)
    private gridApi!: GridApi;

    // Data displayed in the grid
    rowData: any[] = [];

    // Sample data for generating rows
    brands = ['Toyota', 'Ford', 'Porsche', 'BMW', 'Mercedes'];
    models = ['A', 'B', 'C', 'D', 'E'];
    loadCounts = [10, 20, 100, 200, 1_000, 50_000, 100_000, 1_000_000, 5_000_000];

    // Column definitions for ag-grid
    columnDefs: ColDef[] = [
        {
            headerName: 'Photo',
            field: 'imageUrl',
            width: 100,
            cellRenderer: (params: ICellRendererParams) =>
                `<img src="${params.value}" alt="Car" style="height:32px;" />`  // Render image
        },
        {field: 'id', headerName: 'ID', width: 80},
        {field: 'make', headerName: 'Brand', flex: 1},
        {field: 'model', headerName: 'Model', flex: 1},
        {
            field: 'price',
            headerName: 'Price',
            flex: 1,
            type: 'numericColumn',
            filter: 'agNumberColumnFilter'
        },
        {field: 'value', headerName: 'Value', flex: 1, type: 'numericColumn'}
    ];

    // Grid options and default behaviors
    gridOptions: GridOptions = {
        getRowId: params => params.data.id,   // Use 'id' to identify rows
        rowHeight: 50,
        theme: 'legacy',                      // Legacy theme
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true
        },
        rowGroupPanelShow: 'always',          // Show grouping panel
        groupDisplayType: 'multipleColumns',  // Display groups in separate columns
        animateRows: true                     // Enable row animations
    };

    /** Called when the grid is ready; store the API reference */
    onGridReady(e: GridReadyEvent) {
        this.gridApi = e.api;
    }

    /** Called after first data is rendered; measure initial render time */
    onFirstDataRendered(e: FirstDataRenderedEvent) {
        performance.mark('render-end');
        performance.measure('Initial Render Time', 'render-start', 'render-end');
        e.api.sizeColumnsToFit();  // Auto-size columns
        this.captureMetrics();      // Update chart with metrics
    }

    /** Capture performance measures and update the bar chart */
    private captureMetrics() {
        // Gather all performance.measure() entries
        performance.getEntriesByType('measure').forEach(m => {
            this.metrics[m.name] = m.duration;
        });

        // Convert metrics to chart data
        const entries = Object.entries(this.metrics);
        this.barChartData.labels = entries.map(([name]) => name);
        this.barChartData.datasets[0].data = entries.map(([_, duration]) => +duration.toFixed(2));

        // Redraw chart with new data
        this.chart?.update();
    }

    /** Load a given number of rows of data into the grid */
    runDataLoad(count: number) {
        performance.clearMarks();
        performance.clearMeasures();

        // Measure data generation time
        performance.mark('gen-start');
        const data = Array.from({length: count}, (_, i) => ({
            id: i + 1,
            make: this.brands[i % this.brands.length],
            model: this.models[i % this.models.length],
            price: Math.round(Math.random() * 1000000),
            value: Math.random().toFixed(4),
            imageUrl: `assets/car-images/${this.brands[i % this.brands.length].toLowerCase()}.png`
        }));
        performance.mark('gen-end');
        performance.measure('Data Generation Time', 'gen-start', 'gen-end');

        // Bind data to grid and measure binding time
        performance.mark('set-start');
        this.gridApi.setGridOption('rowData', data);
        this.rowData = data;
        performance.mark('set-end');
        performance.measure('Data Binding Time', 'set-start', 'set-end');

        // Start render timing
        performance.mark('render-start');
    }

    /** Apply a delta update: add, update, and remove rows */
    runDeltaUpdate(addCount = 1000, updateCount = 1000, removeCount = 1000) {
        performance.clearMarks();
        performance.clearMeasures();

        // Prepare additions, updates, and removals
        const adds = Array.from({length: addCount}, (_, i) => ({
            id: this.rowData.length + i + 1,
            make: 'New', model: 'X', price: 0, value: 0, imageUrl: ''
        }));
        const updates = this.rowData.slice(0, updateCount).map(r => ({...r, price: (r.price as number) + 1}));
        const removes = this.rowData.slice(-removeCount);

        // Measure delta transaction time
        performance.mark('delta-start');
        this.gridApi.applyTransaction({add: adds, update: updates, remove: removes});
        performance.mark('delta-end');
        performance.measure('Delta Update Time', 'delta-start', 'delta-end');

        // Update local rowData cache
        const toRemove = new Set(removes.map(r => r.id));
        this.rowData = [
            ...this.rowData.filter(r => !toRemove.has(r.id)),
            ...adds
        ].map(r => updates.find(u => u.id === r.id) || r);

        this.captureMetrics();
    }

    /** Sort the grid by a given column (default: price) */
    runSort(colId: string = 'price') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('sort-start');
        this.gridApi.applyColumnState({state: [{colId, sort: 'asc'}], applyOrder: true});
        performance.mark('sort-end');
        performance.measure('Sort Time', 'sort-start', 'sort-end');

        this.captureMetrics();
    }

    /** Apply a quick filter to the grid (default: 'Toyota') */
    runFilter(filterValue = 'Toyota') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('filter-start');
        this.gridApi.setGridOption('quickFilterText', filterValue);
        performance.mark('filter-end');
        performance.measure('Filter Time', 'filter-start', 'filter-end');

        this.captureMetrics();
    }

    /** Scroll through grid rows to test performance */
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

    /** Group rows by a column (default: make/brand) */
    runGroup(colId: string = 'make') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('group-start');
        this.gridApi.applyColumnState({state: [{colId, rowGroup: true, hide: true}], applyOrder: false});
        performance.mark('group-end');
        performance.measure('Grouping Time', 'group-start', 'group-end');

        this.captureMetrics();
    }
}
