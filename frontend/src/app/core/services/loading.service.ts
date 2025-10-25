import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  loading$: Observable<boolean> = this.loadingSubject.asObservable();

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      // Only show loading on first request
      // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => this.loadingSubject.next(true));
    }
  }

  hide(): void {
    this.activeRequests--;
    if (this.activeRequests <= 0) {
      // Hide loading when all requests complete
      this.activeRequests = 0;
      // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => this.loadingSubject.next(false));
    }
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
