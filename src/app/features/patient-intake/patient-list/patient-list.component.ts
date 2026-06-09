import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { Gender, MedicalHistory, Patient } from '../../../core/models/patient.model';
import { PatientService } from '../services/patient.service';
import { phoneValidator } from '../../../shared/validators/phone.validator';
import { CanComponentDeactivate } from '../../../shared/guards/unsaved-changes.guard';

/**
 * View and edit patient records (Story CL-1.2.2).
 *
 * Lists every patient; clicking a row opens an inline edit panel exposing all
 * personal and medical-history fields. Save commits via PUT. Navigating away
 * (or switching rows) with unsaved changes triggers a discard confirmation.
 */
@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss',
})
export class PatientListComponent implements OnInit, CanComponentDeactivate {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);

  /** Gender options for the edit dropdown. */
  readonly genders = Object.values(Gender);
  /** Columns shown in the patient table. */
  readonly displayedColumns = ['name', 'email', 'phone'];

  /** State proxied from the service for the template. */
  readonly patients = this.patientService.patients;
  readonly loading = this.patientService.loading;
  readonly loadError = this.patientService.loadError;
  readonly submitting = this.patientService.submitting;
  readonly submitError = this.patientService.submitError;
  readonly duplicateEmail = this.patientService.duplicateEmail;

  /** The patient currently open in the edit panel, or null. */
  readonly selected = signal<Patient | null>(null);
  /** True briefly after a successful save. */
  readonly saved = signal(false);

  /** Edit form — same fields as registration, populated from the selected patient. */
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [phoneValidator()]],
    dateOfBirth: [''],
    gender: this.fb.control<Gender | null>(null),
    emergencyContactName: ['', [Validators.maxLength(120)]],
    emergencyContactPhone: ['', [phoneValidator()]],
    allergies: ['', [Validators.maxLength(2000)]],
    medications: ['', [Validators.maxLength(2000)]],
    conditions: ['', [Validators.maxLength(2000)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  /** Convenience accessor for template error checks. */
  readonly controls = this.form.controls;

  constructor() {
    // Clear the duplicate-email banner as soon as the user edits the email.
    this.form.controls.email.valueChanges.subscribe(() => {
      if (this.duplicateEmail()) {
        this.patientService.clearErrors();
      }
    });
  }

  ngOnInit(): void {
    void this.patientService.loadPatients();
  }

  /** Open a patient in the edit panel, guarding against discarding unsaved edits. */
  selectPatient(patient: Patient): void {
    if (!this.confirmDiscardIfDirty()) {
      return;
    }
    this.patientService.clearErrors();
    this.saved.set(false);
    this.selected.set(patient);
    this.form.reset({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone ?? '',
      dateOfBirth: patient.dateOfBirth ?? '',
      gender: patient.gender,
      emergencyContactName: patient.emergencyContact?.name ?? '',
      emergencyContactPhone: patient.emergencyContact?.phone ?? '',
      allergies: patient.medicalHistory?.allergies ?? '',
      medications: patient.medicalHistory?.medications ?? '',
      conditions: patient.medicalHistory?.conditions ?? '',
      notes: patient.medicalHistory?.notes ?? '',
    });
  }

  /** Persist the edits via PUT (Story CL-1.2.2). */
  async save(): Promise<void> {
    const current = this.selected();
    this.saved.set(false);
    if (!current || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const updated = await this.patientService.updatePatient(current.id, {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim() || null,
      dateOfBirth: value.dateOfBirth.trim() || null,
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

    if (updated) {
      this.selected.set(updated);
      this.form.markAsPristine();
      this.saved.set(true);
    }
  }

  /** Close the edit panel, guarding against discarding unsaved edits. */
  closeEditor(): void {
    if (!this.confirmDiscardIfDirty()) {
      return;
    }
    this.selected.set(null);
    this.form.reset();
  }

  /** Route-guard hook: block navigation when there are unsaved edits. */
  canDeactivate(): boolean {
    return this.confirmDiscardIfDirty();
  }

  private confirmDiscardIfDirty(): boolean {
    if (!this.form.dirty) {
      return true;
    }
    return window.confirm('You have unsaved changes. Discard them?');
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

  /** Build medical history only when at least one field is filled. */
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
    return Object.values(history).some((field) => field.length > 0) ? history : null;
  }
}
