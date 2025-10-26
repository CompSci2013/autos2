import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorInterceptor } from './error.interceptor';
import { NzNotificationService } from 'ng-zorro-antd/notification';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let notificationService: jasmine.SpyObj<NzNotificationService>;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NzNotificationService', ['error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: NzNotificationService,
          useValue: notificationSpy
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NzNotificationService) as jasmine.SpyObj<NzNotificationService>;

    consoleErrorSpy = spyOn(console, 'error');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    const interceptor = new ErrorInterceptor(notificationService);
    expect(interceptor).toBeTruthy();
  });

  describe('Retry logic', () => {
    it('should retry failed request once before showing error', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => {
          // Should have shown notification after retry failed
          expect(notificationService.error).toHaveBeenCalledTimes(1);
          done();
        }
      });

      // First attempt
      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Error', { status: 500, statusText: 'Server Error' });

      // Retry attempt
      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should succeed on retry without showing error', (done) => {
      const testData = { message: 'success' };

      httpClient.get('/api/test').subscribe(response => {
        expect(response).toEqual(testData);
        // Should NOT have shown notification (retry succeeded)
        expect(notificationService.error).not.toHaveBeenCalled();
        done();
      });

      // First attempt fails
      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Error', { status: 500, statusText: 'Server Error' });

      // Retry succeeds
      const req2 = httpMock.expectOne('/api/test');
      req2.flush(testData);
    });
  });

  describe('Error handling by status code', () => {
    it('should handle network error (status 0)', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'));

      // Retry
      const req2 = httpMock.expectOne('/api/test');
      req2.error(new ProgressEvent('error'));

      expect(notificationService.error).toHaveBeenCalledWith(
        'Connection Error',
        'Cannot connect to server. Please check your internet connection.',
        { nzDuration: 5000 }
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle 401 Unauthorized', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Unauthorized',
        'You are not authorized to access this resource. Please log in again.',
        { nzDuration: 5000 }
      );
    });

    it('should handle 403 Forbidden', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Forbidden',
        'You do not have permission to access this resource.',
        { nzDuration: 5000 }
      );
    });

    it('should handle 404 Not Found', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Not Found', { status: 404, statusText: 'Not Found' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Not Found',
        'The requested resource was not found.',
        { nzDuration: 5000 }
      );
    });

    it('should handle 422 Validation Error with custom message', () => {
      const errorResponse = {
        message: 'Invalid email format'
      };

      httpClient.post('/api/test', {}).subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush(errorResponse, { status: 422, statusText: 'Unprocessable Entity' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush(errorResponse, { status: 422, statusText: 'Unprocessable Entity' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Validation Error',
        'Invalid email format',
        { nzDuration: 5000 }
      );
    });

    it('should handle 422 Validation Error with default message', () => {
      httpClient.post('/api/test', {}).subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Validation Error',
        'Please check your input and try again.',
        { nzDuration: 5000 }
      );
    });

    it('should handle 500 Server Error', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Server Error',
        'A server error occurred. Please try again later.',
        { nzDuration: 5000 }
      );
    });

    it('should handle 503 Service Unavailable', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Server Error',
        'A server error occurred. Please try again later.',
        { nzDuration: 5000 }
      );
    });

    it('should handle unknown error with custom message', () => {
      const errorResponse = {
        message: 'Custom error message'
      };

      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush(errorResponse, { status: 418, statusText: 'I\'m a teapot' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush(errorResponse, { status: 418, statusText: 'I\'m a teapot' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Error',
        'Custom error message',
        { nzDuration: 5000 }
      );
    });

    it('should handle unknown error with default message', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Unknown', { status: 418, statusText: 'I\'m a teapot' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Unknown', { status: 418, statusText: 'I\'m a teapot' });

      expect(notificationService.error).toHaveBeenCalledWith(
        'Error',
        'An unexpected error occurred.',
        { nzDuration: 5000 }
      );
    });
  });

  describe('Console logging', () => {
    it('should log error details to console', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => { /* Expected error */ }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Error', { status: 500, statusText: 'Internal Server Error' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'HTTP Error:',
        jasmine.objectContaining({
          status: 500,
          statusText: 'Internal Server Error',
          url: '/api/test'
        })
      );
    });
  });

  describe('Error propagation', () => {
    it('should propagate error to subscriber after handling', () => {
      let errorReceived: HttpErrorResponse | undefined;

      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: HttpErrorResponse) => {
          errorReceived = error;
        }
      });

      const req1 = httpMock.expectOne('/api/test');
      req1.flush('Error', { status: 404, statusText: 'Not Found' });

      const req2 = httpMock.expectOne('/api/test');
      req2.flush('Error', { status: 404, statusText: 'Not Found' });

      expect(errorReceived).toBeTruthy();
      expect(errorReceived?.status).toBe(404);
    });
  });
});
