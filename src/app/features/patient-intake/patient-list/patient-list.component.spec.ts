import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WritableSignal, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PatientListComponent } from './patient-list.component';
import { PatientService } from '../services/patient.service';
import { Patient } from '../../../core/models/patient.model';

function makePatient(id: number, firstName: string, email: string): Patient {
  return {
    id,
    firstName,
    lastName: 'Test',
    email,
    phone: '+31 6 12345678',
    dateOfBirth: '1990-01-01',
    gender: null,
    emergencyContact: null,
    medicalHistory: null,
    createdAt: '2026-01-01T00:00:00Z',
  };
}

describe('PatientListComponent', () => {
  let fixture: ComponentFixture<PatientListComponent>;
  let component: PatientListComponent;
  let patients: WritableSignal<Patient[]>;
  let service: {
    patients: WritableSignal<Patient[]>;
    loading: WritableSignal<boolean>;
    loadError: WritableSignal<string | null>;
    submitting: WritableSignal<boolean>;
    submitError: WritableSignal<string | null>;
    duplicateEmail: WritableSignal<boolean>;
    loadPatients: jest.Mock;
    updatePatient: jest.Mock;
    clearErrors: jest.Mock;
  };

  beforeEach(async () => {
    patients = signal<Patient[]>([makePatient(1, 'Alice', 'alice@example.com')]);
    service = {
      patients,
      loading: signal(false),
      loadError: signal<string | null>(null),
      submitting: signal(false),
      submitError: signal<string | null>(null),
      duplicateEmail: signal(false),
      loadPatients: jest.fn().mockResolvedValue(undefined),
      updatePatient: jest.fn(),
      clearErrors: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [provideNoopAnimations(), { provide: PatientService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads patients on init and renders a clickable row per patient', () => {
    expect(service.loadPatients).toHaveBeenCalledTimes(1);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tr.cl-row');
    expect(rows.length).toBe(1);
  });

  it('opens the edit panel and populates the form when a row is clicked (CL-1.2.2)', () => {
    const row = (fixture.nativeElement as HTMLElement).querySelector('tr.cl-row') as HTMLElement;
    row.click();
    fixture.detectChanges();

    expect(component.selected()?.id).toBe(1);
    expect(component.controls.firstName.value).toBe('Alice');
    expect(component.controls.email.value).toBe('alice@example.com');
    expect((fixture.nativeElement as HTMLElement).querySelector('.edit-card')).not.toBeNull();
  });

  it('saves edits via PUT with a trimmed payload (CL-1.2.2)', async () => {
    const patient = patients()[0];
    service.updatePatient.mockResolvedValue({ ...patient, firstName: 'Alicia' });

    component.selectPatient(patient);
    component.controls.firstName.setValue('  Alicia  ');
    await component.save();

    expect(service.updatePatient).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ firstName: 'Alicia', email: 'alice@example.com' }),
    );
    expect(component.saved()).toBe(true);
    expect(component.form.dirty).toBe(false);
  });

  it('allows navigation when the form is clean but warns when dirty (CL-1.2.2)', () => {
    component.selectPatient(patients()[0]);
    expect(component.canDeactivate()).toBe(true); // pristine after select

    component.controls.firstName.setValue('Changed');
    component.form.markAsDirty();

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    expect(component.canDeactivate()).toBe(false); // user cancels -> stay
    confirmSpy.mockReturnValue(true);
    expect(component.canDeactivate()).toBe(true); // user confirms -> leave
    confirmSpy.mockRestore();
  });
});
