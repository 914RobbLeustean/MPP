import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ListingService } from '../../services/listing.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SignalrService } from '../../services/signalr.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  isLoading = true;
  private signalrSubscription: Subscription | null = null;
  private chartUpdateSubscription: Subscription | null = null;
  dataLoaded = false;
  priceDistributionChart: any = null;
  qualityDistributionChart: any = null;
  listingsTimeChart: any = null;
  priceData: any = {
    labels: ['No Data'],
    datasets: [{
      label: 'Number of Listings',
      data: [0],
      backgroundColor: ['rgba(200, 200, 200, 0.2)'],
      borderColor: ['rgba(200, 200, 200, 1)'],
      borderWidth: 1
    }]
  };
  qualityData: any = {
    labels: ['No Data'],
    datasets: [{
      label: 'Number of Listings',
      data: [0],
      backgroundColor: ['rgba(200, 200, 200, 0.2)'],
      borderColor: ['rgba(200, 200, 200, 1)'],
      borderWidth: 1
    }]
  };
  timeData: any = {
    labels: ['No Data'],
    datasets: [{
      label: 'New Listings',
      data: [0],
      backgroundColor: 'rgba(168, 57, 57, 0.2)',
      borderColor: 'rgba(168, 57, 57, 1)',
      borderWidth: 1
    }]
  };
  totalListings = 0;
  averagePrice = 0;
  highestPrice = 0;
  private updateSubscription: Subscription | null = null;

  constructor(
    private listingService: ListingService,
    private signalrService: SignalrService // Add SignalR service
  ) { }

  ngOnInit(): void {
    this.loadInitialData();

    // Connect to SignalR
    this.connectToSignalR();
  }

  private async connectToSignalR(): Promise<void> {
    try {
      await this.signalrService.startConnection();
      this.setupSignalRListeners();
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
    }
  }

  private setupSignalRListeners(): void {
    // Listen for new listings
    this.signalrSubscription = this.signalrService.newListing$.subscribe(listing => {
      if (listing) {
        console.log('Received new listing via SignalR:', listing);

        // You could update your listings array here if needed
        // this.listings.unshift(listing);

        // Optionally, you could refresh the data entirely
        // this.loadInitialData();
      }
    });

    // Listen for chart updates
    this.chartUpdateSubscription = this.signalrService.chartUpdate$.subscribe(chartData => {
      if (chartData) {
        console.log('Received chart update via SignalR:', chartData);
        this.updateChartsFromWebSocket(chartData);
      }
    });
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.dataLoaded) {
        this.initializeCharts();
        this.setupRealTimeUpdates();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.signalrSubscription) {
      this.signalrSubscription.unsubscribe();
    }
    if (this.chartUpdateSubscription) {
      this.chartUpdateSubscription.unsubscribe();
    }
    if (this.priceDistributionChart) {
      this.priceDistributionChart.destroy();
    }
    if (this.qualityDistributionChart) {
      this.qualityDistributionChart.destroy();
    }
    if (this.listingsTimeChart) {
      this.listingsTimeChart.destroy();
    }
    this.signalrService.stopConnection();
  }

  // Use the real-time updates from SignalR instead of polling
  setupRealTimeUpdates(): void {
    // We could keep the polling as a fallback, but at a much lower frequency
    this.updateSubscription = interval(60000).pipe( // Update every minute instead of every 10 seconds
      switchMap(() => this.listingService.getListings({ pageSize: 50 }))
    ).subscribe({
      next: (response) => {
        if (response.items && response.items.length > 0) {
          this.updateChartData(response.items);
        }
      },
      error: (error) => {
        console.error('Error updating dashboard data', error);
      }
    });
  }

  updateChartsFromWebSocket(chartData: any): void {
    if (!this.priceDistributionChart || !this.qualityDistributionChart || !this.listingsTimeChart) {
      console.log('Charts not initialized yet, skipping update');
      return;
    }

    try {
      // Update price distribution chart
      if (chartData.priceData) {
        this.priceDistributionChart.data.labels = chartData.priceData.labels;
        this.priceDistributionChart.data.datasets[0].data = chartData.priceData.datasets[0].data;
        this.priceDistributionChart.update();
      }

      // Update quality distribution chart
      if (chartData.qualityData) {
        this.qualityDistributionChart.data.labels = chartData.qualityData.labels;
        this.qualityDistributionChart.data.datasets[0].data = chartData.qualityData.datasets[0].data;
        this.qualityDistributionChart.update();
      }

      // Update time series chart
      if (chartData.timeData) {
        this.listingsTimeChart.data.labels = chartData.timeData.labels;
        this.listingsTimeChart.data.datasets[0].data = chartData.timeData.datasets[0].data;
        this.listingsTimeChart.update();
      }

      // Update statistics
      if (chartData.totalListings !== undefined) {
        this.totalListings = chartData.totalListings;
      }

      if (chartData.averagePrice !== undefined) {
        this.averagePrice = chartData.averagePrice;
      }

      if (chartData.highestPrice !== undefined) {
        this.highestPrice = chartData.highestPrice;
      }
    } catch (error) {
      console.error('Error updating charts from WebSocket:', error);
    }
  }

  loadInitialData(): void {
    this.isLoading = true;
    this.listingService.getListings({ pageSize: 50 }).subscribe({
      next: (response) => {
        if (response.items && response.items.length > 0) {
          this.processInitialData(response.items);
        }
        this.isLoading = false;
        this.dataLoaded = true;
        setTimeout(() => {
          this.initializeCharts();
          this.setupRealTimeUpdates();
        }, 500);
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.isLoading = false;
        this.dataLoaded = true;
        setTimeout(() => {
          this.initializeCharts();
        }, 500);
      }
    });
  }

  processInitialData(listings: any[]): void {
    this.totalListings = listings.length;
    this.averagePrice = listings.reduce((sum, item) => sum + item.price, 0) / listings.length;
    this.highestPrice = Math.max(...listings.map(item => item.price));

    const priceBuckets: { [key: string]: number } = {
      '0-50': 0,
      '50-100': 0,
      '100-200': 0,
      '200-500': 0,
      '500+': 0
    };

    listings.forEach(listing => {
      const price = listing.price;
      if (price <= 50) priceBuckets['0-50']++;
      else if (price <= 100) priceBuckets['50-100']++;
      else if (price <= 200) priceBuckets['100-200']++;
      else if (price <= 500) priceBuckets['200-500']++;
      else priceBuckets['500+']++;
    });

    this.priceData = {
      labels: Object.keys(priceBuckets),
      datasets: [{
        label: 'Number of Listings',
        data: Object.values(priceBuckets),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };

    const qualityCounts: { [key: string]: number } = {};
    listings.forEach(listing => {
      const quality = listing.quality;
      if (quality) {
        qualityCounts[quality] = (qualityCounts[quality] || 0) + 1;
      }
    });

    if (Object.keys(qualityCounts).length > 0) {
      this.qualityData = {
        labels: Object.keys(qualityCounts),
        datasets: [{
          label: 'Number of Listings',
          data: Object.values(qualityCounts),
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      };
    }

    const dates: { [key: string]: number } = {};
    listings.forEach(listing => {
      if (listing.createdAt) {
        const date = new Date(listing.createdAt).toLocaleDateString();
        dates[date] = (dates[date] || 0) + 1;
      }
    });

    if (Object.keys(dates).length > 0) {
      this.timeData = {
        labels: Object.keys(dates),
        datasets: [{
          label: 'New Listings',
          data: Object.values(dates),
          backgroundColor: 'rgba(168, 57, 57, 0.2)',
          borderColor: 'rgba(168, 57, 57, 1)',
          borderWidth: 1,
          tension: 0.1
        }]
      };
    }
  }

  initializeCharts(): void {
    try {
      const priceChartElement = document.getElementById('priceChart') as HTMLCanvasElement;
      const qualityChartElement = document.getElementById('qualityChart') as HTMLCanvasElement;
      const timeChartElement = document.getElementById('timeChart') as HTMLCanvasElement;

      if (priceChartElement) {
        this.priceDistributionChart = new Chart(priceChartElement, {
          type: 'bar',
          data: this.priceData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Price Distribution'
              }
            }
          }
        });
      }

      if (qualityChartElement) {
        this.qualityDistributionChart = new Chart(qualityChartElement, {
          type: 'pie',
          data: this.qualityData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Quality Distribution'
              }
            }
          }
        });
      }

      if (timeChartElement) {
        this.listingsTimeChart = new Chart(timeChartElement, {
          type: 'line',
          data: this.timeData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Listings Over Time'
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }

  updateChartData(listings: any[]): void {
    if (!this.priceDistributionChart || !this.qualityDistributionChart || !this.listingsTimeChart) {
      console.log('Charts not initialized yet, skipping update');
      return;
    }

    try {
      const priceBuckets = {
        '0-50': 0,
        '50-100': 0,
        '100-200': 0,
        '200-500': 0,
        '500+': 0
      };

      listings.forEach(listing => {
        const price = listing.price;
        if (price <= 50) priceBuckets['0-50']++;
        else if (price <= 100) priceBuckets['50-100']++;
        else if (price <= 200) priceBuckets['100-200']++;
        else if (price <= 500) priceBuckets['200-500']++;
        else priceBuckets['500+']++;
      });

      this.priceDistributionChart.data.datasets[0].data = Object.values(priceBuckets);
      this.priceDistributionChart.update();

      const qualityCounts: { [key: string]: number } = {};
      listings.forEach(listing => {
        const quality = listing.quality;
        if (quality) {
          qualityCounts[quality] = (qualityCounts[quality] || 0) + 1;
        }
      });

      if (Object.keys(qualityCounts).length > 0) {
        this.qualityDistributionChart.data.labels = Object.keys(qualityCounts);
        this.qualityDistributionChart.data.datasets[0].data = Object.values(qualityCounts);
        this.qualityDistributionChart.update();
      }

      const dates: { [key: string]: number } = {};
      listings.forEach(listing => {
        if (listing.createdAt) {
          const date = new Date(listing.createdAt).toLocaleDateString();
          dates[date] = (dates[date] || 0) + 1;
        }
      });

      if (Object.keys(dates).length > 0) {
        this.listingsTimeChart.data.labels = Object.keys(dates);
        this.listingsTimeChart.data.datasets[0].data = Object.values(dates);
        this.listingsTimeChart.update();
      }

      this.totalListings = listings.length;
      this.averagePrice = listings.reduce((sum, item) => sum + item.price, 0) / listings.length;
      this.highestPrice = Math.max(...listings.map(item => item.price));

    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }
}
