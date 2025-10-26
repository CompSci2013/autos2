import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should start with loading = false', (done) => {
      service.loading$.subscribe(loading => {
        expect(loading).toBe(false);
        done();
      });
    });

    it('should start with isLoading() = false', () => {
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('show()', () => {
    it('should set loading to true on first call', fakeAsync(() => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(state => loadingStates.push(state));

      service.show();
      tick(); // Process setTimeout

      expect(loadingStates).toEqual([false, true]);
      expect(service.isLoading()).toBe(true);
    }));

    it('should increment activeRequests counter', fakeAsync(() => {
      service.show();
      tick();
      expect(service.isLoading()).toBe(true);

      service.show();
      tick();
      expect(service.isLoading()).toBe(true);

      service.show();
      tick();
      expect(service.isLoading()).toBe(true);
    }));

    it('should only emit true once when called multiple times', fakeAsync(() => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(state => loadingStates.push(state));

      service.show();
      tick();
      service.show();
      tick();
      service.show();
      tick();

      // Should only emit false (initial) and true (first show)
      expect(loadingStates).toEqual([false, true]);
    }));
  });

  describe('hide()', () => {
    it('should set loading to false when all requests complete', fakeAsync(() => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(state => loadingStates.push(state));

      service.show();
      tick();
      service.hide();
      tick();

      expect(loadingStates).toEqual([false, true, false]);
      expect(service.isLoading()).toBe(false);
    }));

    it('should only hide loading after all requests complete', fakeAsync(() => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(state => loadingStates.push(state));

      service.show(); // Request 1
      tick();
      service.show(); // Request 2
      tick();
      service.show(); // Request 3
      tick();

      service.hide(); // Complete 1
      tick();
      expect(service.isLoading()).toBe(true);

      service.hide(); // Complete 2
      tick();
      expect(service.isLoading()).toBe(true);

      service.hide(); // Complete 3
      tick();
      expect(service.isLoading()).toBe(false);

      // Should only emit false (initial), true (first show), false (all complete)
      expect(loadingStates).toEqual([false, true, false]);
    }));

    it('should clamp activeRequests at 0', fakeAsync(() => {
      service.hide(); // No active requests
      tick();
      service.hide(); // Still no active requests
      tick();

      expect(service.isLoading()).toBe(false);
    }));

    it('should handle hide() called more times than show()', fakeAsync(() => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(state => loadingStates.push(state));

      service.show();
      tick();
      service.hide();
      tick();
      service.hide(); // Extra hide
      tick();
      service.hide(); // Extra hide
      tick();

      expect(service.isLoading()).toBe(false);
      // Service emits false for each hide() call when activeRequests <= 0
      expect(loadingStates).toEqual([false, true, false, false, false]);
    }));
  });

  describe('isLoading()', () => {
    it('should return current loading state', fakeAsync(() => {
      expect(service.isLoading()).toBe(false);

      service.show();
      tick();
      expect(service.isLoading()).toBe(true);

      service.hide();
      tick();
      expect(service.isLoading()).toBe(false);
    }));
  });

  describe('Complex scenarios', () => {
    it('should handle interleaved show/hide calls correctly', fakeAsync(() => {
      const loadingStates: boolean[] = [];
      service.loading$.subscribe(state => loadingStates.push(state));

      service.show(); // Active: 1
      tick();
      service.show(); // Active: 2
      tick();
      service.hide(); // Active: 1
      tick();
      service.show(); // Active: 2
      tick();
      service.hide(); // Active: 1
      tick();
      service.hide(); // Active: 0
      tick();

      expect(service.isLoading()).toBe(false);
      expect(loadingStates).toEqual([false, true, false]);
    }));

    it('should handle rapid show/hide cycles', fakeAsync(() => {
      for (let i = 0; i < 100; i++) {
        service.show();
        tick();
      }
      expect(service.isLoading()).toBe(true);

      for (let i = 0; i < 100; i++) {
        service.hide();
        tick();
      }
      expect(service.isLoading()).toBe(false);
    }));
  });
});
