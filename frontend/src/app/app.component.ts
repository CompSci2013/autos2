import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  title = 'autos2-app';
  loading$ = this.loadingService.loading$;

  constructor(
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    // Trigger change detection after view init to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.cdr.detectChanges();
  }
}
