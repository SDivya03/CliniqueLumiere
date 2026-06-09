import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { RegistrationFormComponent } from './registration-form.component';
import { PatientService } from '../services/patient.service';
import { Patient } from '../../../core/models/patient.model';

describe('RegistrationFormComponent', () => {
  let fixture: ComponentFixture<RegistrationFormComponent>;
  let component: RegistrationFormComponent;
  let patientService: PatientService;
  let registerSpy: jest.SpyInstance;

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationFormComponent);
    component = fixture.componentInstance;
    patientService = TestBed.inject(PatientService);
    registerSpy = jest.spyOn(patientService, 'register').mockResolvedValue(fakePatient);
    fixture.detectChanges();
  });

  const fillValid = () =>
    component.form.patchValue({
      firstName: 'Marie',
      lastName: 'Dubois',
      email: 'marie@example.com',
    });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('is invalid when required fields are empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('does not call the API when required fields are missing', async () => {
    await component.submit();
    expect(registerSpy).not.toHaveBeenCalled();
    expect(component.controls.firstName.touched).toBe(true);
  });

  it('rejects an invalid email format', () => {
    component.controls.email.setValue('user@');
    expect(component.controls.email.hasError('email')).toBe(true);
  });

  it('rejects a malformed phone number but allows an empty one', () => {
    component.controls.phone.setValue('12');
    expect(component.controls.phone.hasError('phone')).toBe(true);

    component.controls.phone.setValue('');
    expect(component.controls.phone.valid).toBe(true);
  });

  it('treats emergency contact fields as optional', () => {
    fillValid();
    expect(component.form.valid).toBe(true);
  });

  it('submits a valid form via the patient service', async () => {
    fillValid();
    await component.submit();
    expect(registerSpy).toHaveBeenCalledTimes(1);
  });

  it('trims and lowercases the email before submitting', async () => {
    component.form.patchValue({
      firstName: '  Marie  ',
      lastName: 'Dubois',
      email: 'Marie@Example.com',
    });
    await component.submit();
    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'marie@example.com', firstName: 'Marie' }),
    );
  });

  it('clears the form and flags success after a registration', async () => {
    fillValid();
    await component.submit();
    expect(component.registered()).toBe(true);
    expect(component.controls.firstName.value).toBe('');
  });

  it('auto-dismisses the success banner after a few seconds (CL-1.1.3)', async () => {
    jest.useFakeTimers();
    try {
      fillValid();
      await component.submit();
      expect(component.registered()).toBe(true);

      jest.advanceTimersByTime(5000);
      expect(component.registered()).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('renders the inline duplicate-email message after a real 409 response (CL-1.1.2)', async () => {
    // Exercise the real service path: a 409 must surface as an inline message in the DOM.
    registerSpy.mockRestore();
    const httpMock = TestBed.inject(HttpTestingController);
    fillValid();

    const submitted = component.submit();
    const req = httpMock.expectOne('http://localhost:5050/api/patients');
    expect(req.request.method).toBe('POST');
    req.flush(
      { title: 'Email already registered' },
      { status: 409, statusText: 'Conflict' },
    );
    await submitted;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const error = el.querySelector('.cl-field-error');
    expect(error?.textContent).toContain('A patient with this email already exists');
    expect(component.registered()).toBe(false);
    httpMock.verify();
  });

  it('treats all medical history fields as optional (CL-1.2.1)', () => {
    fillValid();
    // No medical history entered — the form must still be valid.
    expect(component.form.valid).toBe(true);
  });

  it('includes medical history in the payload when filled (CL-1.2.1)', async () => {
    fillValid();
    component.form.patchValue({
      allergies: '  Penicillin  ',
      medications: 'Ibuprofen',
      conditions: 'Asthma',
      notes: '',
    });

    await component.submit();

    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        medicalHistory: {
          allergies: 'Penicillin',
          medications: 'Ibuprofen',
          conditions: 'Asthma',
          notes: '',
        },
      }),
    );
  });

  it('sends null medical history when no field is filled (CL-1.2.1)', async () => {
    fillValid();
    await component.submit();
    expect(registerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ medicalHistory: null }),
    );
  });

  it('keeps entered medical history when the section is collapsed (CL-1.2.1)', () => {
    const el = fixture.nativeElement as HTMLElement;
    // Reactive-form controls live in the FormGroup, independent of the panel's
    // expanded/collapsed state, so toggling the header must not clear them.
    component.controls.allergies.setValue('Penicillin');
    fixture.detectChanges();

    const header = el.querySelector('mat-expansion-panel-header') as HTMLElement;
    header.click(); // expand
    fixture.detectChanges();
    header.click(); // collapse
    fixture.detectChanges();

    expect(component.controls.allergies.value).toBe('Penicillin');
    // The textarea is retained in the DOM (content is not destroyed on collapse).
    expect(el.querySelector('textarea[formcontrolname="allergies"]')).not.toBeNull();
  });
});
