import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private notification: NzNotificationService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      retry(1), // Retry failed requests once
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    let message: string;
    let title = 'Error';

    if (error.status === 0) {
      // Client-side or network error
      title = 'Connection Error';
      message = 'Cannot connect to server. Please check your internet connection.';
    } else if (error.status === 401) {
      title = 'Unauthorized';
      message = 'You are not authorized to access this resource. Please log in again.';
    } else if (error.status === 403) {
      title = 'Forbidden';
      message = 'You do not have permission to access this resource.';
    } else if (error.status === 404) {
      title = 'Not Found';
      message = 'The requested resource was not found.';
    } else if (error.status === 422) {
      title = 'Validation Error';
      message = error.error?.message || 'Please check your input and try again.';
    } else if (error.status >= 500) {
      title = 'Server Error';
      message = 'A server error occurred. Please try again later.';
    } else {
      message = error.error?.message || 'An unexpected error occurred.';
    }

    // Show notification to user
    this.notification.error(title, message, { nzDuration: 5000 });

    // Log error to console for debugging
    console.error('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
  }
}
