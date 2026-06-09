import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { PatientService } from './patient.service';
import { ApiService } from '../../../core/services/api.service';
import { CreatePatientRequest, Patient } from '../../../core/models/patient.model';

describe('PatientService', () => {
  let service: PatientService;
  let api: { createPatient: jest.Mock; getPatients: jest.Mock };

  const request: CreatePatientRequest = {
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie@example.com',
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
  };

  const fakePatient: Patient = {
    id: 1,
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie@example.com',
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    api = { createPatient: jest.fn(), getPatients: jest.fn() };
    TestBed.configureTestingModule({
      providers: [PatientService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(PatientService);
  });

  it('adds the created patient to the top of the list on success', async () => {
    api.createPatient.mockReturnValue(of(fakePatient));

    const created = await service.register(request);

    expect(created).toEqual(fakePatient);
    expect(service.patients()[0]).toEqual(fakePatient);
    expect(service.patientCount()).toBe(1);
    expect(service.duplicateEmail()).toBe(false);
    expect(service.submitError()).toBeNull();
  });

  it('flags a duplicate email and surfaces an inline message on HTTP 409 (CL-1.1.2)', async () => {
    api.createPatient.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    const created = await service.register(request);

    expect(created).toBeNull();
    expect(service.duplicateEmail()).toBe(true);
    expect(service.submitError()).toBe('A patient with this email already exists');
    expect(service.patientCount()).toBe(0);
  });

  it('shows a generic error (not a duplicate) on other failures', async () => {
    api.createPatient.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    await service.register(request);

    expect(service.duplicateEmail()).toBe(false);
    expect(service.submitError()).toBe('Could not register the patient. Please try again.');
  });

  it('clears the duplicate-email state when errors are cleared', async () => {
    api.createPatient.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );
    await service.register(request);
    expect(service.duplicateEmail()).toBe(true);

    service.clearErrors();

    expect(service.duplicateEmail()).toBe(false);
    expect(service.submitError()).toBeNull();
  });
});
