import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from '../../../core/services/api.service';
import {
  Appointment,
  CreateAppointmentRequest,
  Practitioner,
  Service,
} from '../../../core/models/appointment.model';
import { Patient } from '../../../core/models/patient.model';

/**
 * Signal-based state for the Appointments module.
 *
 * Owns all HTTP calls and error handling; components read signals and never
 * subscribe or catch errors directly (see CLAUDE.md standards).
 */
@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly api = inject(ApiService);

  private readonly _services = signal<Service[]>([]);
  private readonly _practitioners = signal<Practitioner[]>([]);
  private readonly _patientSuggestions = signal<Patient[]>([]);
  private readonly _submitting = signal(false);
  private readonly _submitError = signal<string | null>(null);
  private readonly _loadError = signal<string | null>(null);

  /** Available services (populated on form init). */
  readonly services = this._services.asReadonly();
  /** Available practitioners (populated on form init). */
  readonly practitioners = this._practitioners.asReadonly();
  /** Patient suggestions for the autocomplete search. */
  readonly patientSuggestions = this._patientSuggestions.asReadonly();
  /** True while a booking request is in flight. */
  readonly submitting = this._submitting.asReadonly();
  /** A human-readable error from the last booking attempt, or null. */
  readonly submitError = this._submitError.asReadonly();
  /** A human-readable error that occurred while loading reference data, or null. */
  readonly loadError = this._loadError.asReadonly();

  /**
   * Load services and practitioners required to populate the booking form.
   * Errors are surfaced via the `loadError` signal.
   */
  async loadFormData(): Promise<void> {
    this._loadError.set(null);

    try {
      const [services, practitioners] = await Promise.all([
        new Promise<Service[]>((resolve, reject) =>
          this.api.getServices().subscribe({ next: resolve, error: reject }),
        ),
        new Promise<Practitioner[]>((resolve, reject) =>
          this.api.getPractitioners().subscribe({ next: resolve, error: reject }),
        ),
      ]);
      this._services.set(services);
      this._practitioners.set(practitioners);
    } catch {
      this._loadError.set('Could not load form data. Please refresh and try again.');
    }
  }

  /**
   * Search registered patients by name or email for the autocomplete field.
   * Clears suggestions when the term is blank.
   */
  async searchPatients(term: string): Promise<void> {
    if (!term.trim()) {
      this._patientSuggestions.set([]);
      return;
    }

    try {
      const patients = await new Promise<Patient[]>((resolve, reject) =>
        this.api.getPatients(term).subscribe({ next: resolve, error: reject }),
      );
      this._patientSuggestions.set(patients);
    } catch {
      this._patientSuggestions.set([]);
    }
  }

  /** Clear the patient suggestion list (e.g. after selection). */
  clearPatientSuggestions(): void {
    this._patientSuggestions.set([]);
  }

  /**
   * Book a new appointment.
   * @returns the created appointment on success, or null on failure.
   *          Failures are also surfaced via the `submitError` signal.
   */
  async book(payload: CreateAppointmentRequest): Promise<Appointment | null> {
    this._submitting.set(true);
    this._submitError.set(null);

    try {
      return await new Promise<Appointment>((resolve, reject) =>
        this.api.createAppointment(payload).subscribe({ next: resolve, error: reject }),
      );
    } catch (error) {
      this._submitError.set(
        error instanceof HttpErrorResponse && error.status === 400
          ? 'Start time must be in the future.'
          : 'Could not book the appointment. Please try again.',
      );
      return null;
    } finally {
      this._submitting.set(false);
    }
  }

  /** Reset transient submit error state. */
  clearSubmitError(): void {
    this._submitError.set(null);
  }
}
