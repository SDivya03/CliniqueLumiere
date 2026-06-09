import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { BookingFormComponent } from './booking-form.component';
import { AppointmentService } from '../services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';
import { Patient } from '../../../core/models/patient.model';

describe('BookingFormComponent', () => {
  let fixture: ComponentFixture<BookingFormComponent>;
  let component: BookingFormComponent;
  let appointmentService: AppointmentService;

  const fakePatient: Patient = {
    id: 42,
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@example.com',
    phone: null,
    dateOfBirth: null,
    gender: null,
    emergencyContact: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const fakeAppointment: Appointment = {
    id: 1,
    patientId: 42,
    patientName: 'Sophie Bernard',
    practitionerId: 1,
    practitionerName: 'Claire Dubois',
    serviceId: 2,
    serviceName: 'Follow-up Consultation',
    serviceDurationMinutes: 30,
    startTime: '2026-07-01T09:00:00Z',
    endTime: '2026-07-01T09:30:00Z',
    createdAt: '2026-06-09T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingFormComponent);
    component = fixture.componentInstance;
    appointmentService = TestBed.inject(AppointmentService);

    jest.spyOn(appointmentService, 'loadFormData').mockResolvedValue();
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('form is invalid when no fields are filled', () => {
    expect(component.form.valid).toBe(false);
  });

  it('canSubmit is false when no patient is selected', () => {
    component.form.patchValue({
      patientSearch: 'Sophie Bernard',
      practitionerId: 1,
      serviceId: 2,
      date: new Date('2027-01-01'),
      startTime: '10:00',
    });
    // selectedPatient is still null
    expect(component.canSubmit()).toBe(false);
  });

  it('canSubmit is true when form is valid and patient is selected', () => {
    component.form.patchValue({
      patientSearch: 'Sophie Bernard',
      practitionerId: 1,
      serviceId: 2,
      date: new Date('2027-01-01'),
      startTime: '10:00',
    });
    component.selectedPatient.set(fakePatient);
    expect(component.canSubmit()).toBe(true);
  });

  it('does not call the API when form is invalid', async () => {
    const bookSpy = jest.spyOn(appointmentService, 'book');
    await component.submit();
    expect(bookSpy).not.toHaveBeenCalled();
    expect(component.controls.patientSearch.touched).toBe(true);
  });

  it('marks all controls touched on failed submit', async () => {
    await component.submit();
    expect(component.controls.practitionerId.touched).toBe(true);
    expect(component.controls.serviceId.touched).toBe(true);
    expect(component.controls.date.touched).toBe(true);
    expect(component.controls.startTime.touched).toBe(true);
  });

  it('submits valid form via appointment service', async () => {
    const bookSpy = jest.spyOn(appointmentService, 'book').mockResolvedValue(fakeAppointment);

    component.selectedPatient.set(fakePatient);
    component.form.patchValue({
      patientSearch: 'Sophie Bernard',
      practitionerId: 1,
      serviceId: 2,
      date: new Date('2027-01-01'),
      startTime: '09:00',
    });

    await component.submit();

    expect(bookSpy).toHaveBeenCalledTimes(1);
    expect(bookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        patientId: 42,
        practitionerId: 1,
        serviceId: 2,
      }),
    );
  });

  it('shows success banner and resets after a successful booking', async () => {
    jest.spyOn(appointmentService, 'book').mockResolvedValue(fakeAppointment);

    component.selectedPatient.set(fakePatient);
    component.form.patchValue({
      patientSearch: 'Sophie Bernard',
      practitionerId: 1,
      serviceId: 2,
      date: new Date('2027-01-01'),
      startTime: '09:00',
    });

    await component.submit();

    expect(component.booked()).toBe(true);
    expect(component.selectedPatient()).toBeNull();
    expect(component.controls.patientSearch.value).toBe('');
  });

  it('does not reset form on failed booking', async () => {
    jest.spyOn(appointmentService, 'book').mockResolvedValue(null);

    component.selectedPatient.set(fakePatient);
    component.form.patchValue({
      patientSearch: 'Sophie Bernard',
      practitionerId: 1,
      serviceId: 2,
      date: new Date('2027-01-01'),
      startTime: '09:00',
    });

    await component.submit();

    expect(component.booked()).toBe(false);
    expect(component.selectedPatient()).toBe(fakePatient);
  });

  it('onPatientSelected stores the patient and updates the search field', () => {
    component.onPatientSelected(fakePatient);
    expect(component.selectedPatient()).toBe(fakePatient);
    expect(component.controls.patientSearch.value).toBe('Sophie Bernard');
  });

  it('endTime is empty when start time or service is not set', () => {
    expect(component.endTime()).toBe('');
  });
});
