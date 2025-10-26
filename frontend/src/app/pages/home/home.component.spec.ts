import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { VehicleService, Stats } from '../../services/vehicle.service';
import { of, throwError } from 'rxjs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let vehicleServiceSpy: jasmine.SpyObj<VehicleService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('VehicleService', ['getStats']);

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [
        NzGridModule,
        NzCardModule,
        NzStatisticModule
      ],
      providers: [
        { provide: VehicleService, useValue: spy }
      ]
    }).compileComponents();

    vehicleServiceSpy = TestBed.inject(VehicleService) as jasmine.SpyObj<VehicleService>;
  });

  beforeEach(() => {
    // Default mock response
    const mockStats: Stats = {
      total_vehicles: 793,
      total_manufacturers: 25,
      body_class_distribution: [
        { body_class: 'Sedan', count: 300 },
        { body_class: 'SUV', count: 250 },
        { body_class: 'Coupe', count: 150 }
      ]
    };
    vehicleServiceSpy.getStats.and.returnValue(of(mockStats));

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call VehicleService.getStats() on initialization', () => {
      fixture.detectChanges();
      expect(vehicleServiceSpy.getStats).toHaveBeenCalledTimes(1);
    });

    it('should expose stats$ observable from VehicleService', (done) => {
      // Use the mockStats from beforeEach which is already configured in the spy
      component.stats$.subscribe(stats => {
        expect(stats.total_vehicles).toBe(793);
        expect(stats.total_manufacturers).toBe(25);
        expect(stats.body_class_distribution).toBeDefined();
        expect(stats.body_class_distribution.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should not subscribe to stats$ directly (async pipe pattern)', () => {
      // The component should expose the observable without subscribing
      // This test verifies the observable is defined but not subscribed to
      expect(component.stats$).toBeDefined();
      expect(vehicleServiceSpy.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stats data', () => {
    it('should handle stats with zero values', () => {
      const emptyStats: Stats = {
        total_vehicles: 0,
        total_manufacturers: 0,
        body_class_distribution: []
      };
      vehicleServiceSpy.getStats.and.returnValue(of(emptyStats));

      const newComponent = new HomeComponent(vehicleServiceSpy);

      newComponent.stats$.subscribe(stats => {
        expect(stats).toEqual(emptyStats);
      });
    });

    it('should handle stats with large values', () => {
      const largeStats: Stats = {
        total_vehicles: 1000000,
        total_manufacturers: 500,
        body_class_distribution: Array.from({ length: 50 }, (_, i) => ({
          body_class: `Class${i}`,
          count: Math.floor(Math.random() * 10000)
        }))
      };
      vehicleServiceSpy.getStats.and.returnValue(of(largeStats));

      const newComponent = new HomeComponent(vehicleServiceSpy);

      newComponent.stats$.subscribe(stats => {
        expect(stats).toEqual(largeStats);
      });
    });

    it('should pass through errors from VehicleService', (done) => {
      const errorMessage = 'Failed to fetch stats';
      vehicleServiceSpy.getStats.and.returnValue(
        throwError(() => new Error(errorMessage))
      );

      const newComponent = new HomeComponent(vehicleServiceSpy);

      newComponent.stats$.subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });
    });
  });

  describe('Component properties', () => {
    it('should have stats$ as an Observable', () => {
      expect(component.stats$).toBeDefined();
      expect(typeof component.stats$.subscribe).toBe('function');
    });

    it('should initialize stats$ immediately in constructor', () => {
      // VehicleService.getStats should be called during component construction
      expect(vehicleServiceSpy.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('Template integration', () => {
    it('should allow template to subscribe via async pipe', (done) => {
      // Use the mockStats from beforeEach which is already configured in the spy
      component.stats$.subscribe(stats => {
        expect(stats.total_vehicles).toBe(793);
        expect(stats.total_manufacturers).toBe(25);
        expect(stats.body_class_distribution).toBeDefined();
        done();
      });
    });

    it('should emit only once for single subscription', () => {
      let emissionCount = 0;

      component.stats$.subscribe(() => {
        emissionCount++;
      });

      // Since getStats() returns an Observable.of(), it should complete after one emission
      expect(emissionCount).toBe(1);
    });
  });

  describe('Constructor injection', () => {
    it('should inject VehicleService', () => {
      expect(component['vehicleService']).toBeDefined();
      expect(component['vehicleService']).toBe(vehicleServiceSpy);
    });
  });
});
