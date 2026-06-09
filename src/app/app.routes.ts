import { Routes } from '@angular/router';

import { unsavedChangesGuard } from './shared/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'patients' },
  {
    path: 'patients',
    title: 'Patient Intake — Clinique Lumière',
    loadComponent: () =>
      import(
        './features/patient-intake/registration-form/registration-form.component'
      ).then((m) => m.RegistrationFormComponent),
  },
  {
    path: 'patients/manage',
    title: 'Manage Patients — Clinique Lumière',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/patient-intake/patient-list/patient-list.component').then(
        (m) => m.PatientListComponent,
      ),
    path: 'appointments/new',
    title: 'Book Appointment — Clinique Lumière',
    loadComponent: () =>
      import(
        './features/appointments/booking-form/booking-form.component'
      ).then((m) => m.BookingFormComponent),
  },
];
