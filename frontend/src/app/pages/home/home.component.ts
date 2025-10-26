import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { VehicleService, Stats } from '../../services/vehicle.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  // Expose observable directly - async pipe handles subscription
  stats$: Observable<Stats> = this.vehicleService.getStats();

  constructor(private vehicleService: VehicleService) { }
}
