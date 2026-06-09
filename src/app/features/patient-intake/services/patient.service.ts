import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from '../../../core/services/api.service';
import { CreatePatientRequest, Patient } from '../../../core/models/patient.model';

/**
 * Signal-based state for the Patient Intake module.
 *
 * All HTTP errors are caught here and surfaced through signals; components
 * read state and never subscribe to errors directly (see CLAUDE.md standards).
 */
@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly api = inject(ApiService);

  private readonly _patients = signal<Patient[]>([]);
  private readonly _submitting = signal(false);
  private readonly _submitError = signal<string | null>(null);
  private readonly _duplicateEmail = signal(false);

  /** Registered patients, most recent first. */
  readonly patients = this._patients.asReadonly();
  /** True while a registration request is in flight. */
  readonly submitting = this._submitting.asReadonly();
  /** A human-readable error from the last registration attempt, or null. */
  readonly submitError = this._submitError.asReadonly();
  /** True when the last attempt failed because the email already exists. */
  readonly duplicateEmail = this._duplicateEmail.asReadonly();
  /** Total number of registered patients. */
  readonly patientCount = computed(() => this._patients().length);

  /**
   * Register a new patient.
   * @returns a promise that resolves to the created patient, or null on failure.
   *          Failures are also reflected in the `submitError`/`duplicateEmail` signals.
   */
  async register(payload: CreatePatientRequest): Promise<Patient | null> {
    this._submitting.set(true);
    this._submitError.set(null);
    this._duplicateEmail.set(false);

    try {
      const created = await new Promise<Patient>((resolve, reject) => {
        this.api.createPatient(payload).subscribe({ next: resolve, error: reject });
      });
      // Newest patient on top so the list reflects the latest registration first.
      this._patients.update((current) => [created, ...current]);
      return created;
    } catch (error) {
      this.handleError(error);
      return null;
    } finally {
      this._submitting.set(false);
    }
  }

  /** Reset transient error state, e.g. when the user edits the form again. */
  clearErrors(): void {
    this._submitError.set(null);
    this._duplicateEmail.set(false);
  }

  /**
   * Translate an HTTP failure into user-facing signal state.
   * A 409 is treated as a duplicate-email conflict (enforced by CL-1.1.2).
   */
  private handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      this._duplicateEmail.set(true);
      this._submitError.set('A patient with this email already exists');
      return;
    }
    this._submitError.set('Could not register the patient. Please try again.');
  }
}
