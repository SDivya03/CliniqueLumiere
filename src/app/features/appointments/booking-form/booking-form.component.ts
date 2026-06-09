import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AppointmentService } from '../services/appointment.service';
import { Patient } from '../../../core/models/patient.model';
import { Service } from '../../../core/models/appointment.model';

/**
 * Booking form for scheduling a new appointment (Story CL-2.1.1).
 *
 * The form is disabled until a patient is selected via the autocomplete.
 * Selecting a service auto-calculates the end time using the service's
 * `durationMinutes`. All fields are required; the date picker restricts
 * selection to future dates.
 */
@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.scss',
})
export class BookingFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);

  /** Reactive state proxied from the service. */
  readonly services = this.appointmentService.services;
  readonly practitioners = this.appointmentService.practitioners;
  readonly patientSuggestions = this.appointmentService.patientSuggestions;
  readonly submitting = this.appointmentService.submitting;
  readonly submitError = this.appointmentService.submitError;
  readonly loadError = this.appointmentService.loadError;
  readonly conflict = this.appointmentService.conflict;

  /** The patient selected from the autocomplete; drives the rest of the form. */
  readonly selectedPatient = signal<Patient | null>(null);

  /** True once a booking succeeds; drives the inline success banner. */
  readonly booked = signal(false);

  /** Tomorrow — lower bound for the date picker. */
  readonly minDate = this.tomorrow();

  /** The booking form. Patient is an autocomplete text input; id stored separately via `selectedPatient`. */
  readonly form = this.fb.nonNullable.group({
    patientSearch: ['', Validators.required],
    practitionerId: this.fb.control<number | null>(null, Validators.required),
    serviceId: this.fb.control<number | null>(null, Validators.required),
    date: this.fb.control<Date | null>(null, Validators.required),
    startTime: ['', Validators.required],
  });

  /** Signal-backed form values so computed() can react to changes. */
  private readonly serviceIdValue = toSignal(this.form.controls.serviceId.valueChanges, {
    initialValue: null as number | null,
  });
  private readonly startTimeValue = toSignal(this.form.controls.startTime.valueChanges, {
    initialValue: '',
  });

  /** Auto-calculated end time string ("HH:mm"), recomputed reactively when start time or service changes. */
  readonly endTime = computed(() => {
    const startTime = this.startTimeValue();
    const serviceId = this.serviceIdValue();
    if (!startTime || !serviceId) {
      return '';
    }
    const service = this.services().find((s) => s.id === serviceId);
    if (!service) {
      return '';
    }
    return this.addMinutes(startTime, service.durationMinutes);
  });

  /** Convenience accessor for template error checks. */
  readonly controls = this.form.controls;

  /** Disable submit while form is invalid, no patient selected, or request is in flight. */
  readonly canSubmit = computed(
    () => this.form.valid && this.selectedPatient() !== null && !this.submitting(),
  );

  constructor() {
    // Debounce patient search to avoid hammering the API on every keystroke.
    this.form.controls.patientSearch.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        // Clear selection if user types after picking a patient.
        if (this.selectedPatient()?.firstName + ' ' + this.selectedPatient()?.lastName !== term) {
          this.selectedPatient.set(null);
        }
        void this.appointmentService.searchPatients(term);
      });
  }

  async ngOnInit(): Promise<void> {
    await this.appointmentService.loadFormData();
  }

  /**
   * Called when the user picks a patient from the autocomplete panel.
   * Locks in the patient and clears the suggestion list.
   */
  onPatientSelected(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.form.controls.patientSearch.setValue(`${patient.firstName} ${patient.lastName}`);
    this.appointmentService.clearPatientSuggestions();
  }

  /**
   * Display function for the mat-autocomplete — shows full name in the input.
   * Called with `this` bound to the component, so a bound arrow is used.
   */
  readonly displayPatient = (patient: Patient | string): string => {
    if (!patient) return '';
    if (typeof patient === 'string') return patient;
    return `${patient.firstName} ${patient.lastName}`;
  };

  /** The currently selected service, recomputed reactively when the service dropdown changes. */
  readonly selectedService = computed<Service | undefined>(() =>
    this.services().find((s) => s.id === this.serviceIdValue()),
  );

  /**
   * Validate and submit the form. Blocks on missing patient selection and
   * marks all fields touched so inline errors appear on first failed attempt.
   */
  async submit(): Promise<void> {
    this.booked.set(false);

    if (this.form.invalid || !this.selectedPatient()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const startIso = this.buildStartTimeIso(value.date!, value.startTime);

    const created = await this.appointmentService.book({
      patientId: this.selectedPatient()!.id,
      practitionerId: value.practitionerId!,
      serviceId: value.serviceId!,
      startTime: startIso,
    });

    if (created) {
      this.booked.set(true);
      this.form.reset();
      this.selectedPatient.set(null);
      this.appointmentService.clearPatientSuggestions();
    }
  }

  /**
   * Format an ISO 8601 date-time string as a local "HH:mm" time for display
   * in the conflict message (Story CL-2.1.2).
   */
  formatTime(iso: string): string {
    const d = new Date(iso);
    return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
  }

  /**
   * Combine a Date (from the date picker) and a "HH:mm" string into an ISO 8601
   * UTC date-time string accepted by the backend.
   */
  private buildStartTimeIso(date: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  }

  /** Add `minutes` to a "HH:mm" string and return the result as "HH:mm". */
  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const hh = `${Math.floor(total / 60) % 24}`.padStart(2, '0');
    const mm = `${total % 60}`.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private tomorrow(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
