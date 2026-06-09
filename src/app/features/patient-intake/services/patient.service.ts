import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import {
  CreatePatientRequest,
  Patient,
  UpdatePatientRequest,
} from '../../../core/models/patient.model';

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
  private readonly _loading = signal(false);
  private readonly _loadError = signal<string | null>(null);

  /** Registered patients, most recent first. */
  readonly patients = this._patients.asReadonly();
  /** True while a registration or update request is in flight. */
  readonly submitting = this._submitting.asReadonly();
  /** A human-readable error from the last register/update attempt, or null. */
  readonly submitError = this._submitError.asReadonly();
  /** True when the last attempt failed because the email already exists. */
  readonly duplicateEmail = this._duplicateEmail.asReadonly();
  /** True while the patient list is being loaded from the API. */
  readonly loading = this._loading.asReadonly();
  /** A human-readable error from the last load attempt, or null. */
  readonly loadError = this._loadError.asReadonly();
  /** Total number of registered patients. */
  readonly patientCount = computed(() => this._patients().length);

  /**
   * Load every patient from the API into the `patients` signal (Story CL-1.2.2).
   * Replaces the in-memory list; errors are surfaced via `loadError`.
   */
  async loadPatients(): Promise<void> {
    this._loading.set(true);
    this._loadError.set(null);
    try {
      const patients = await firstValueFrom(this.api.getPatients());
      this._patients.set(patients);
    } catch {
      this._loadError.set('Could not load patients. Please try again.');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Update an existing patient (Story CL-1.2.2).
   * @returns the updated patient, or null on failure. Failures are reflected in
   *          the `submitError`/`duplicateEmail` signals.
   */
  async updatePatient(id: number, payload: UpdatePatientRequest): Promise<Patient | null> {
    this._submitting.set(true);
    this._submitError.set(null);
    this._duplicateEmail.set(false);

    try {
      const updated = await firstValueFrom(this.api.updatePatient(id, payload));
      this._patients.update((current) => current.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (error) {
      this.handleError(error, 'Could not save changes. Please try again.');
      return null;
    } finally {
      this._submitting.set(false);
    }
  }

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
      this.handleError(error, 'Could not register the patient. Please try again.');
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
   * A 409 is treated as a duplicate-email conflict (enforced by CL-1.1.2); any
   * other failure surfaces the caller-supplied fallback message.
   */
  private handleError(error: unknown, fallback: string): void {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      this._duplicateEmail.set(true);
      this._submitError.set('A patient with this email already exists');
      return;
    }
    this._submitError.set(fallback);
  }
}
