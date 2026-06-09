import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, computed, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { RecentlyRegisteredComponent } from './recently-registered.component';
import { PatientService } from '../services/patient.service';
import { Patient } from '../../../core/models/patient.model';

function makePatient(id: number, firstName: string, email: string): Patient {
  return {
    id,
    firstName,
    lastName: 'Test',
    email,
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
    createdAt: '2026-01-01T09:30:00Z',
  };
}

describe('RecentlyRegisteredComponent', () => {
  let patients: WritableSignal<Patient[]>;
  let fixture: ComponentFixture<RecentlyRegisteredComponent>;

  beforeEach(async () => {
    patients = signal<Patient[]>([]);
    const stub: Pick<PatientService, 'patients' | 'patientCount'> = {
      patients: patients.asReadonly(),
      patientCount: computed(() => patients().length),
    };

    await TestBed.configureTestingModule({
      imports: [RecentlyRegisteredComponent],
      providers: [provideNoopAnimations(), { provide: PatientService, useValue: stub }],
    }).compileComponents();

    fixture = TestBed.createComponent(RecentlyRegisteredComponent);
  });

  it('renders nothing when no patient has registered this session', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.recent-card')).toBeNull();
  });

  it('lists patients newest-first from the service signal (CL-1.1.3)', () => {
    // The service prepends, so index 0 is the most recently registered patient.
    patients.set([
      makePatient(2, 'Newest', 'newest@example.com'),
      makePatient(1, 'Older', 'older@example.com'),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.recent-card')).not.toBeNull();

    const text = el.textContent ?? '';
    expect(text).toContain('Newest Test');
    expect(text).toContain('newest@example.com');
    expect(text).toContain('Older Test');
    // Newest must appear before the older entry in the DOM.
    expect(text.indexOf('Newest Test')).toBeLessThan(text.indexOf('Older Test'));
  });

  it('reflects a new registration immediately when the signal updates (no reload)', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.recent-card')).toBeNull();

    patients.set([makePatient(1, 'Fresh', 'fresh@example.com')]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Fresh Test');
  });
});
