import { Component } from '@angular/core';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'autos2-app';
  loading$ = this.loadingService.loading$;

  constructor(private loadingService: LoadingService) { }
}
