import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { PatientService } from './patient.service';
import { CreatePatientRequest, Patient } from '../../../core/models/patient.model';

/**
 * Unit tests for {@link PatientService}: verifies signal-based state transitions
 * and HTTP error translation (Story CL-1.1.1 / CL-1.1.2). HTTP is faked with
 * {@link HttpTestingController} so the service + ApiService are exercised together.
 */
describe('PatientService', () => {
  const API_URL = 'http://localhost:5050/api/patients';

  let service: PatientService;
  let httpMock: HttpTestingController;

  const payload: CreatePatientRequest = {
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@example.com',
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
  };

  const created: Patient = {
    id: 1,
    firstName: 'Marie',
    lastName: 'Dubois',
    email: 'marie.dubois@example.com',
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts with empty, non-error state', () => {
    expect(service.patients()).toEqual([]);
    expect(service.patientCount()).toBe(0);
    expect(service.submitting()).toBe(false);
    expect(service.submitError()).toBeNull();
    expect(service.duplicateEmail()).toBe(false);
  });

  // TC-FE-SVC-01
  it('adds the created patient to the top of the list and clears submitting', async () => {
    const promise = service.register(payload);
    expect(service.submitting()).toBe(true);

    httpMock.expectOne({ method: 'POST', url: API_URL }).flush(created);
    const result = await promise;

    expect(result).toEqual(created);
    expect(service.patients()).toEqual([created]);
    expect(service.patientCount()).toBe(1);
    expect(service.submitting()).toBe(false);
    expect(service.submitError()).toBeNull();
  });

  // TC-FE-SVC-01 (ordering: newest first)
  it('places the most recently registered patient first', async () => {
    const first = service.register(payload);
    httpMock.expectOne(API_URL).flush(created);
    await first;

    const second = service.register({ ...payload, email: 'second@example.com' });
    const newer: Patient = { ...created, id: 2, email: 'second@example.com' };
    httpMock.expectOne(API_URL).flush(newer);
    await second;

    expect(service.patients().map((p) => p.id)).toEqual([2, 1]);
  });

  // TC-FE-SVC-02
  it('maps a 409 to the duplicate-email state and returns null', async () => {
    const promise = service.register(payload);
    httpMock
      .expectOne(API_URL)
      .flush('conflict', { status: 409, statusText: 'Conflict' });
    const result = await promise;

    expect(result).toBeNull();
    expect(service.duplicateEmail()).toBe(true);
    expect(service.submitError()).toBe('A patient with this email already exists');
    expect(service.patients()).toEqual([]);
    expect(service.submitting()).toBe(false);
  });

  // TC-FE-SVC-03
  it('maps a 500 to a generic error and leaves duplicateEmail false', async () => {
    const promise = service.register(payload);
    httpMock
      .expectOne(API_URL)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    const result = await promise;

    expect(result).toBeNull();
    expect(service.duplicateEmail()).toBe(false);
    expect(service.submitError()).toBe(
      'Could not register the patient. Please try again.',
    );
    expect(service.submitting()).toBe(false);
  });

  // TC-FE-SVC-04
  it('clearErrors resets both error signals', async () => {
    const promise = service.register(payload);
    httpMock
      .expectOne(API_URL)
      .flush('conflict', { status: 409, statusText: 'Conflict' });
    await promise;
    expect(service.duplicateEmail()).toBe(true);

    service.clearErrors();

    expect(service.duplicateEmail()).toBe(false);
    expect(service.submitError()).toBeNull();
  });

  // TC-FE-SVC-03 (network failure)
  it('treats a network failure as a generic error', async () => {
    const promise = service.register(payload);
    httpMock
      .expectOne(API_URL)
      .error(new ProgressEvent('network error'));
    const result = await promise;

    expect(result).toBeNull();
    expect(service.submitError()).toBe(
      'Could not register the patient. Please try again.',
    );
    expect(service.duplicateEmail()).toBe(false);
  });

  it('resets prior errors when a new registration starts', async () => {
    const failed = service.register(payload);
    httpMock.expectOne(API_URL).flush('boom', { status: 500, statusText: 'Server Error' });
    await failed;
    expect(service.submitError()).not.toBeNull();

    const promise = service.register(payload);
    expect(service.submitError()).toBeNull();
    expect(service.duplicateEmail()).toBe(false);
    httpMock.expectOne(API_URL).flush(created);
    await promise;
  });
});
