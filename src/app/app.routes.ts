import { Routes } from '@angular/router';

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
];
