import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AppointmentService } from './appointment.service';
import { ApiService } from '../../../core/services/api.service';
import { Appointment, AppointmentConflict } from '../../../core/models/appointment.model';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let apiService: ApiService;

  const fakeAppointment: Appointment = {
    id: 1,
    patientId: 42,
    patientName: 'Sophie Bernard',
    practitionerId: 1,
    practitionerName: 'Claire Dubois',
    serviceId: 2,
    serviceName: 'Follow-up Consultation',
    serviceDurationMinutes: 30,
    startTime: '2027-01-01T09:00:00Z',
    endTime: '2027-01-01T09:30:00Z',
    createdAt: '2026-06-09T10:00:00Z',
  };

  const bookPayload = {
    patientId: 42,
    practitionerId: 1,
    serviceId: 2,
    startTime: '2027-01-01T09:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentService);
    apiService = TestBed.inject(ApiService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('book()', () => {
    it('returns the appointment and clears conflict on success', async () => {
      jest.spyOn(apiService, 'createAppointment').mockReturnValue({
        subscribe: ({ next }: { next: (v: Appointment) => void }) => { next(fakeAppointment); return { unsubscribe: () => {} }; },
      } as never);

      const result = await service.book(bookPayload);

      expect(result).toEqual(fakeAppointment);
      expect(service.conflict()).toBeNull();
      expect(service.submitError()).toBeNull();
    });

    it('sets conflict signal on 409 and returns null', async () => {
      const conflictBody: AppointmentConflict = {
        practitionerName: 'Claire Dubois',
        conflictStart: '2027-01-01T09:00:00Z',
        conflictEnd: '2027-01-01T09:30:00Z',
      };
      const error = new HttpErrorResponse({ status: 409, error: conflictBody });

      jest.spyOn(apiService, 'createAppointment').mockReturnValue({
        subscribe: ({ error: onError }: { error: (e: unknown) => void }) => { onError(error); return { unsubscribe: () => {} }; },
      } as never);

      const result = await service.book(bookPayload);

      expect(result).toBeNull();
      expect(service.conflict()).toEqual(conflictBody);
      expect(service.submitError()).toBeNull();
    });

    it('sets submitError on 400 and returns null', async () => {
      const error = new HttpErrorResponse({ status: 400 });

      jest.spyOn(apiService, 'createAppointment').mockReturnValue({
        subscribe: ({ error: onError }: { error: (e: unknown) => void }) => { onError(error); return { unsubscribe: () => {} }; },
      } as never);

      const result = await service.book(bookPayload);

      expect(result).toBeNull();
      expect(service.submitError()).toBe('Start time must be in the future.');
      expect(service.conflict()).toBeNull();
    });

    it('sets generic submitError on unexpected errors and returns null', async () => {
      const error = new HttpErrorResponse({ status: 500 });

      jest.spyOn(apiService, 'createAppointment').mockReturnValue({
        subscribe: ({ error: onError }: { error: (e: unknown) => void }) => { onError(error); return { unsubscribe: () => {} }; },
      } as never);

      const result = await service.book(bookPayload);

      expect(result).toBeNull();
      expect(service.submitError()).toBe('Could not book the appointment. Please try again.');
    });

    it('clears conflict and submitError at the start of each new attempt', async () => {
      service['_conflict'].set({ practitionerName: 'X', conflictStart: '', conflictEnd: '' });
      service['_submitError'].set('previous error');

      jest.spyOn(apiService, 'createAppointment').mockReturnValue({
        subscribe: ({ next }: { next: (v: Appointment) => void }) => { next(fakeAppointment); return { unsubscribe: () => {} }; },
      } as never);

      await service.book(bookPayload);

      expect(service.conflict()).toBeNull();
      expect(service.submitError()).toBeNull();
    });
  });

  describe('clearSubmitError()', () => {
    it('resets both submitError and conflict', () => {
      service['_submitError'].set('some error');
      service['_conflict'].set({ practitionerName: 'X', conflictStart: '', conflictEnd: '' });

      service.clearSubmitError();

      expect(service.submitError()).toBeNull();
      expect(service.conflict()).toBeNull();
    });
  });
});
