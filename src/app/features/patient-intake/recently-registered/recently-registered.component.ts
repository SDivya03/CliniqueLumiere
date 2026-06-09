import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { PatientService } from '../services/patient.service';

/**
 * Recently registered patients (Story CL-1.1.3).
 *
 * Presentational list bound to the {@link PatientService} `patients` signal so a
 * newly registered patient appears at the top instantly, with no page reload.
 * The full, paginated patient table is owned by CL-1.3.1.
 */
@Component({
  selector: 'app-recently-registered',
  standalone: true,
  imports: [DatePipe, MatCardModule, MatIconModule, MatListModule],
  templateUrl: './recently-registered.component.html',
  styleUrl: './recently-registered.component.scss',
})
export class RecentlyRegisteredComponent {
  private readonly patientService = inject(PatientService);

  /** Patients registered this session, newest first (the service prepends on create). */
  readonly patients = this.patientService.patients;

  /** How many patients have been registered this session. */
  readonly count = this.patientService.patientCount;
}
