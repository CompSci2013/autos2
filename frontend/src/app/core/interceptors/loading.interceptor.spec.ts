import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoadingInterceptor } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';

describe('LoadingInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: LoadingService;
  let showSpy: jasmine.Spy;
  let hideSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LoadingService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: LoadingInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService);

    showSpy = spyOn(loadingService, 'show');
    hideSpy = spyOn(loadingService, 'hide');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    const interceptor = new LoadingInterceptor(loadingService);
    expect(interceptor).toBeTruthy();
  });

  describe('Successful requests', () => {
    it('should call show() before request and hide() after success', () => {
      const testData = { message: 'success' };

      httpClient.get('/api/test').subscribe(response => {
        expect(response).toEqual(testData);
      });

      expect(showSpy).toHaveBeenCalledTimes(1);
      expect(hideSpy).not.toHaveBeenCalled();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('GET');

      req.flush(testData);

      expect(showSpy).toHaveBeenCalledTimes(1);
      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle POST requests', () => {
      const testData = { id: 1, name: 'Test' };

      httpClient.post('/api/test', { name: 'Test' }).subscribe(response => {
        expect(response).toEqual(testData);
      });

      expect(showSpy).toHaveBeenCalledTimes(1);

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('POST');
      req.flush(testData);

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle PUT requests', () => {
      const testData = { id: 1, name: 'Updated' };

      httpClient.put('/api/test/1', { name: 'Updated' }).subscribe(response => {
        expect(response).toEqual(testData);
      });

      expect(showSpy).toHaveBeenCalledTimes(1);

      const req = httpMock.expectOne('/api/test/1');
      expect(req.request.method).toBe('PUT');
      req.flush(testData);

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle DELETE requests', () => {
      httpClient.delete('/api/test/1').subscribe(response => {
        expect(response).toEqual({});
      });

      expect(showSpy).toHaveBeenCalledTimes(1);

      const req = httpMock.expectOne('/api/test/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Failed requests', () => {
    it('should call hide() even when request fails with 404', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
        }
      });

      expect(showSpy).toHaveBeenCalledTimes(1);
      expect(hideSpy).not.toHaveBeenCalled();

      const req = httpMock.expectOne('/api/test');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    it('should call hide() when request fails with 500', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
        }
      });

      expect(showSpy).toHaveBeenCalledTimes(1);

      const req = httpMock.expectOne('/api/test');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    it('should call hide() when request fails with network error', () => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(0);
        }
      });

      expect(showSpy).toHaveBeenCalledTimes(1);

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'));

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple concurrent requests', () => {
    it('should call show() for each request and hide() when each completes', () => {
      httpClient.get('/api/test1').subscribe();
      httpClient.get('/api/test2').subscribe();
      httpClient.get('/api/test3').subscribe();

      expect(showSpy).toHaveBeenCalledTimes(3);
      expect(hideSpy).not.toHaveBeenCalled();

      const req1 = httpMock.expectOne('/api/test1');
      const req2 = httpMock.expectOne('/api/test2');
      const req3 = httpMock.expectOne('/api/test3');

      req1.flush({ data: 1 });
      expect(hideSpy).toHaveBeenCalledTimes(1);

      req2.flush({ data: 2 });
      expect(hideSpy).toHaveBeenCalledTimes(2);

      req3.flush({ data: 3 });
      expect(hideSpy).toHaveBeenCalledTimes(3);
    });

    it('should call hide() for both successful and failed requests', () => {
      httpClient.get('/api/success').subscribe();
      httpClient.get('/api/fail').subscribe({
        error: () => { /* Expected error */ }
      });

      expect(showSpy).toHaveBeenCalledTimes(2);

      const req1 = httpMock.expectOne('/api/success');
      const req2 = httpMock.expectOne('/api/fail');

      req1.flush({ success: true });
      expect(hideSpy).toHaveBeenCalledTimes(1);

      req2.flush('Error', { status: 500, statusText: 'Server Error' });
      expect(hideSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request cancellation', () => {
    it('should call hide() when request is cancelled', () => {
      const subscription = httpClient.get('/api/test').subscribe();

      expect(showSpy).toHaveBeenCalledTimes(1);
      expect(hideSpy).not.toHaveBeenCalled();

      const req = httpMock.expectOne('/api/test');

      subscription.unsubscribe();

      // Note: Don't flush after unsubscribe - request is cancelled
      // The interceptor's finalize() will still call hide()

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });
  });
});
