import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Gender, MedicalHistory } from '../../../core/models/patient.model';
import { PatientService } from '../services/patient.service';
import { RecentlyRegisteredComponent } from '../recently-registered/recently-registered.component';
import { phoneValidator } from '../../../shared/validators/phone.validator';

/** How long the success banner stays visible before auto-dismissing (ms). */
const SUCCESS_VISIBLE_MS = 5000;

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
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    RecentlyRegisteredComponent,
  ],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss',
})
export class RegistrationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly destroyRef = inject(DestroyRef);

  /** Timer that hides the success banner; cleared on resubmit and on destroy. */
  private dismissTimer?: ReturnType<typeof setTimeout>;

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
    allergies: ['', [Validators.maxLength(2000)]],
    medications: ['', [Validators.maxLength(2000)]],
    conditions: ['', [Validators.maxLength(2000)]],
    notes: ['', [Validators.maxLength(2000)]],
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

    // Don't leave a pending hide-timer running after the component is gone.
    this.destroyRef.onDestroy(() => this.clearDismissTimer());
  }

  /** Convenience accessor for template error checks. */
  controls = this.form.controls;

  /**
   * Validate and submit the form. When invalid, marks all fields touched so
   * inline errors appear and aborts without calling the API.
   */
  async submit(): Promise<void> {
    this.clearDismissTimer();
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
      medicalHistory: this.buildMedicalHistory(
        value.allergies,
        value.medications,
        value.conditions,
        value.notes,
      ),
    });

    if (created) {
      this.registered.set(true);
      this.form.reset();
      this.scheduleDismiss();
    }
  }

  /** Show the success banner briefly, then hide it automatically (Story CL-1.1.3). */
  private scheduleDismiss(): void {
    this.clearDismissTimer();
    this.dismissTimer = setTimeout(() => this.registered.set(false), SUCCESS_VISIBLE_MS);
  }

  /** Cancel a pending auto-dismiss, if any. */
  private clearDismissTimer(): void {
    if (this.dismissTimer !== undefined) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
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

  /** Build medical history only when at least one field is filled (Story CL-1.2.1). */
  private buildMedicalHistory(
    allergies: string,
    medications: string,
    conditions: string,
    notes: string,
  ): MedicalHistory | null {
    const history: MedicalHistory = {
      allergies: allergies.trim(),
      medications: medications.trim(),
      conditions: conditions.trim(),
      notes: notes.trim(),
    };
    const hasAny = Object.values(history).some((field) => field.length > 0);
    return hasAny ? history : null;
  }

  /** Format a Date as a yyyy-mm-dd string without timezone drift. */
  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
