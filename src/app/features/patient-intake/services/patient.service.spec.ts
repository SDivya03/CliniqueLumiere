import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { PatientService } from './patient.service';
import { ApiService } from '../../../core/services/api.service';
import {
  CreatePatientRequest,
  Patient,
  UpdatePatientRequest,
} from '../../../core/models/patient.model';

/**
 * Unit tests for {@link PatientService}: verifies signal-based state transitions
 * and HTTP error translation for register (CL-1.1.1/1.1.2), load and update
 * (CL-1.2.2). ApiService is mocked so the service is exercised in isolation.
 */
describe('PatientService', () => {
  let service: PatientService;
  let api: {
    createPatient: jest.Mock;
    getPatients: jest.Mock;
    updatePatient: jest.Mock;
  };

  const request: CreatePatientRequest = {
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie@example.com',
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
    medicalHistory: null,
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
    medicalHistory: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    api = {
      createPatient: jest.fn(),
      getPatients: jest.fn(),
      updatePatient: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [PatientService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(PatientService);
  });

  describe('register', () => {
    it('adds the created patient to the top of the list on success', async () => {
      api.createPatient.mockReturnValue(of(fakePatient));

      const created = await service.register(request);

      expect(created).toEqual(fakePatient);
      expect(service.patients()[0]).toEqual(fakePatient);
      expect(service.duplicateEmail()).toBe(false);
      expect(service.submitError()).toBeNull();
    });

    it('flags a duplicate email and surfaces an inline message on HTTP 409', async () => {
      api.createPatient.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

      const created = await service.register(request);

      expect(created).toBeNull();
      expect(service.duplicateEmail()).toBe(true);
      expect(service.submitError()).toBe('A patient with this email already exists');
    });

    it('shows the register fallback message on other failures', async () => {
      api.createPatient.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      await service.register(request);

      expect(service.duplicateEmail()).toBe(false);
      expect(service.submitError()).toBe('Could not register the patient. Please try again.');
    });
  });

  describe('loadPatients', () => {
    it('replaces the list with patients from the API', async () => {
      const second: Patient = { ...fakePatient, id: 2, email: 'lucas@example.com' };
      api.getPatients.mockReturnValue(of([fakePatient, second]));

      await service.loadPatients();

      expect(service.patients()).toEqual([fakePatient, second]);
      expect(service.patientCount()).toBe(2);
      expect(service.loadError()).toBeNull();
    });

    it('surfaces a load error when the request fails', async () => {
      api.getPatients.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      await service.loadPatients();

      expect(service.loadError()).toBe('Could not load patients. Please try again.');
    });
  });

  describe('updatePatient', () => {
    const update: UpdatePatientRequest = { ...request, lastName: 'Durand' };

    beforeEach(async () => {
      api.getPatients.mockReturnValue(of([fakePatient]));
      await service.loadPatients();
    });

    it('replaces the patient in the list on success (CL-1.2.2)', async () => {
      const updated: Patient = { ...fakePatient, lastName: 'Durand' };
      api.updatePatient.mockReturnValue(of(updated));

      const result = await service.updatePatient(1, update);

      expect(result).toEqual(updated);
      expect(service.patients()[0].lastName).toBe('Durand');
      expect(service.submitError()).toBeNull();
    });

    it('flags a duplicate email on HTTP 409', async () => {
      api.updatePatient.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

      const result = await service.updatePatient(1, update);

      expect(result).toBeNull();
      expect(service.duplicateEmail()).toBe(true);
      expect(service.submitError()).toBe('A patient with this email already exists');
    });

    it('shows the save fallback message on other failures', async () => {
      api.updatePatient.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      await service.updatePatient(1, update);

      expect(service.submitError()).toBe('Could not save changes. Please try again.');
    });
  });

  it('clears transient error state via clearErrors', async () => {
    api.createPatient.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await service.register(request);
    expect(service.duplicateEmail()).toBe(true);

    service.clearErrors();

    expect(service.duplicateEmail()).toBe(false);
    expect(service.submitError()).toBeNull();
  });
});
