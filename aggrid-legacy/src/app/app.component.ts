// Import core Angular functionality, change detection strategy, and ViewChild to hook into the chart component
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';

// Import AG Grid types for column definitions, API access, and grid lifecycle events
import {
    ColDef,
    GridApi,
    GridReadyEvent
} from 'ag-grid-community';
import { FirstDataRenderedEvent } from 'ag-grid-community/dist/lib/events';

// ── CHARTS (v2 API) ─────────────────────────────────────────────────────────────
// Import the BaseChartDirective to control the chart instance, and Label type for axis labels
import { BaseChartDirective, Label } from 'ng2-charts';
// Import Chart.js types for options, chart type, and dataset configuration
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
// Import the datalabels plugin, which registers itself globally on import
import 'chartjs-plugin-datalabels';

@Component({
    selector: 'app-root',               // Component selector in templates
    templateUrl: './app.component.html',// External HTML template
    styleUrls: ['./app.component.css'], // External CSS styles
    changeDetection: ChangeDetectionStrategy.OnPush // Optimize performance by checking inputs only
})
export class AppComponent {

    // ── CHART HOOK & CONFIG ───────────────────────────────────────────────────────
    /** Reference to the chart directive instance, for updating/redrawing */
    @ViewChild(BaseChartDirective, { static: false }) chart!: BaseChartDirective;

    /** Chart type: a vertical bar chart */
    public barChartType: ChartType = 'bar';
    /** Labels displayed along the x-axis */
    public barChartLabels: Label[] = [];
    /** Dataset configuration for the bars: numeric data and formatting options */
    public barChartData: ChartDataSets[] = [
        {
            data: [],                // values will be populated dynamically
            label: 'ms',             // legend label
            datalabels: {            // plugin-specific settings for each bar label
                anchor: 'end',
                align: 'start',
                formatter: (v: number) => v.toFixed(2)
            }
        }
    ];
    /** Global chart options: responsiveness, axes labels, and plugin settings */
    public barChartOptions: ChartOptions = {
        responsive: true,
        legend: { display: false }, // hide the legend since we only have one series
        scales: {
            xAxes: [{
                scaleLabel: { display: true, labelString: 'Metric' }
            }],
            yAxes: [{
                ticks: { beginAtZero: true },
                scaleLabel: { display: true, labelString: 'Duration (ms)' }
            }]
        },
        plugins: {
            datalabels: {                     // plugin namespace matches import name
                color: 'black',
                font: { weight: 'bold' },
                anchor: 'end',
                align: 'start',
                formatter: (v: number) => v.toFixed(2) + ' ms'
            }
        }
    };

    // ── AG GRID SETUP ─────────────────────────────────────────────────────────────
    private gridApi!: GridApi;          // Will hold reference to the grid's API once ready

    /** Data rows displayed in the grid */
    rowData: any[] = [];

    /** Column definitions: header names, data fields, and custom renderers */
    columnDefs: ColDef[] = [
        {
            headerName: 'Photo',            // Column header
            field: 'imageUrl',              // Property in the row data
            // Render cell as an <img> tag with styling
            cellRenderer: params =>
                `<img
                   src="${params.value}"
                   alt="Photo"
                   style="height:40px; width:60%; border-radius:4px"
                 />`
        },
        { field: 'id',     headerName: 'ID' },
        { field: 'make',   headerName: 'Make' },
        { field: 'model',  headerName: 'Model' },
        { field: 'price',  headerName: 'Price', type: 'numericColumn' },
        { field: 'value',  headerName: 'Value', type: 'numericColumn' }
    ];

    /** Global grid options: row height and default column behavior */
    gridOptions = {
        rowHeight: 50,
        defaultColDef: {
            resizable: true,
            sortable: true,
            filter: true
        }
    };

    /** Stores measured durations for each operation */
    metrics: Record<string, number> = {};

    /** Sample data pools for random generation */
    private makes = ['Toyota', 'Ford', 'Porsche', 'BMW', 'Mercedes'];
    private models = ['A', 'B', 'C', 'D', 'E'];

    /** Triggered when the grid is first ready: capture the API reference */
    onGridReady(event: GridReadyEvent) {
        this.gridApi = event.api;
    }

    // ── PERFORMANCE TESTS ─────────────────────────────────────────────────────────

    /**
     * 1) Full load test: generate a batch of rows, bind to grid, and measure render time
     * @param count Number of rows to generate
     */
    runDataLoad(count: number) {
        // Clear previous performance entries
        performance.clearMarks();
        performance.clearMeasures();

        // Measure data generation time
        performance.mark('gen-start');
        const data = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            make: this.makes[i % this.makes.length],
            model: this.models[i % this.models.length],
            price: Math.round(Math.random() * 100_0000),
            value: Math.random().toFixed(4),
            imageUrl: `assets/car-images/${this.makes[i % this.makes.length].toLowerCase()}.png`
        }));
        performance.mark('gen-end');
        performance.measure('Data Generation Time', 'gen-start', 'gen-end');

        // Measure data binding time
        performance.mark('set-start');
        this.gridApi.setRowData(data);
        performance.mark('set-end');
        performance.measure('Data Binding Time', 'set-start', 'set-end');

        // Start render timing; end timing in onFirstDataRendered()
        performance.mark('render-start');
    }

    /**
     * Captures end of initial rendering and processes measured times
     */
    onFirstDataRendered(event: FirstDataRenderedEvent) {
        performance.mark('render-end');
        performance.measure('Initial Render Time', 'render-start', 'render-end');
        this.captureMetrics();
    }

    /**
     * 2) Delta update test: add, update, and remove rows in one operation
     */
    runDeltaUpdate(addCount = 1000, updateCount = 1000, removeCount = 1000) {
        performance.clearMarks();
        performance.clearMeasures();

        // Prepare arrays for adds, updates, and removes
        const adds = Array.from({ length: addCount }, (_, i) => ({
            id: this.rowData.length + i + 1,
            make: 'New', model: 'X', price: 0, value: 0, imageUrl: ''
        }));
        const updates = this.rowData.slice(0, updateCount).map(r => ({ ...r, price: r.price + 1 }));
        const removes = this.rowData.slice(-removeCount);

        // Measure delta update time
        performance.mark('delta-start');
        this.gridApi.updateRowData({ add: adds, update: updates, remove: removes });
        performance.mark('delta-end');
        performance.measure('Delta Update Time', 'delta-start', 'delta-end');

        this.captureMetrics();
    }

    /**
     * 3) Measure sort performance on a specified column (legacy API)
     */
    runSort(colId = 'price') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('sort-start');
        this.gridApi.setSortModel([{ colId, sort: 'asc' }]);
        performance.mark('sort-end');
        performance.measure('Sort Time', 'sort-start', 'sort-end');

        this.captureMetrics();
    }

    /**
     * 4) Measure quick filter performance
     */
    runFilter(filterValue = 'Toyota') {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('filter-start');
        this.gridApi.setQuickFilter(filterValue);
        performance.mark('filter-end');
        performance.measure('Filter Time', 'filter-start', 'filter-end');

        this.captureMetrics();
    }

    /**
     * 5) Frame-by-frame scroll test: scroll by batches of 1000 rows
     */
    async runScroll() {
        performance.clearMarks();
        performance.clearMeasures();

        performance.mark('scroll-start');
        for (let i = 0; i < this.rowData.length; i += 1000) {
            this.gridApi.ensureIndexVisible(i, 'top');
            // Wait one animation frame between scrolls
            await new Promise(r => requestAnimationFrame(r));
        }
        performance.mark('scroll-end');
        performance.measure('Scroll Test Time', 'scroll-start', 'scroll-end');

        this.captureMetrics();
    }

    /**
     * 6) Measure grouping performance by updating column definitions
     */
    runGroup(colId = 'make') {
        performance.clearMarks();
        performance.clearMeasures();

        // Add rowGroup flag to the chosen column
        const defs = this.columnDefs.map(c => ({ ...c, rowGroup: c.field === colId }));

        performance.mark('group-start');
        this.gridApi.setColumnDefs(defs);
        performance.mark('group-end');
        performance.measure('Grouping Time', 'group-start', 'group-end');

        this.captureMetrics();
    }

    /**
     * Collects performance measures, updates the metrics object and redraws the chart
     */
    private captureMetrics() {
        // Read measured durations into the metrics record
        performance.getEntriesByType('measure').forEach(m => {
            this.metrics[m.name] = m.duration;
        });

        // Map metric names and values into chart labels and data arrays
        const entries = Object.entries(this.metrics);
        this.barChartLabels = entries.map(([k]) => k);
        this.barChartData[0].data = entries.map(([, v]) => +v.toFixed(2));

        // Trigger chart redraw if available
        if (this.chart) {
            this.chart.update();
        }
    }
}
