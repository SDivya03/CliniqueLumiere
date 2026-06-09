import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Gender } from '../../../core/models/patient.model';
import { PatientService } from '../services/patient.service';
import { phoneValidator } from '../../../shared/validators/phone.validator';

/**
 * Patient registration form (Story CL-1.1.1).
 *
 * Captures personal details plus an optional emergency contact and enforces
 * client-side validation: required First/Last name and Email, email format,
 * and phone format when a number is supplied. Submission is blocked while the
 * form is invalid; all errors render inline beneath their field.
 */
@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss',
})
export class RegistrationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);

  /** Gender options rendered in the dropdown. */
  readonly genders = Object.values(Gender);
  /** Latest year selectable as a date of birth (today). */
  readonly maxDob = new Date();

  /** True once a registration succeeds; drives the inline success banner. */
  readonly registered = signal(false);

  /** Reactive state proxied from the service for the template. */
  readonly submitting = this.patientService.submitting;
  readonly duplicateEmail = this.patientService.duplicateEmail;
  readonly submitError = this.patientService.submitError;

  /** Registration form with per-field validators. */
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [phoneValidator()]],
    dateOfBirth: this.fb.control<Date | null>(null),
    gender: this.fb.control<Gender | null>(null),
    emergencyContactName: ['', [Validators.maxLength(120)]],
    emergencyContactPhone: ['', [phoneValidator()]],
  });

  /** Disable submit while invalid or in flight. */
  readonly canSubmit = computed(() => !this.submitting());

  constructor() {
    // Clear the duplicate-email banner as soon as the user edits the email.
    this.form.controls.email.valueChanges.subscribe(() => {
      if (this.duplicateEmail()) {
        this.patientService.clearErrors();
      }
    });
  }

  /** Convenience accessor for template error checks. */
  controls = this.form.controls;

  /**
   * Validate and submit the form. When invalid, marks all fields touched so
   * inline errors appear and aborts without calling the API.
   */
  async submit(): Promise<void> {
    this.registered.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const created = await this.patientService.register({
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim() || null,
      dateOfBirth: value.dateOfBirth ? this.toIsoDate(value.dateOfBirth) : null,
      gender: value.gender,
      emergencyContact: this.buildEmergencyContact(
        value.emergencyContactName,
        value.emergencyContactPhone,
      ),
    });

    if (created) {
      this.registered.set(true);
      this.form.reset();
    }
  }

  /** Build an emergency contact only when at least one field is filled. */
  private buildEmergencyContact(name: string, phone: string) {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName && !trimmedPhone) {
      return null;
    }
    return { name: trimmedName, phone: trimmedPhone };
  }

  /** Format a Date as a yyyy-mm-dd string without timezone drift. */
  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
