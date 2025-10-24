import { Component, OnInit } from '@angular/core';
import { VehicleService, Stats } from '../../services/vehicle.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  stats: Stats | null = null;

  constructor(private vehicleService: VehicleService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.vehicleService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

}
