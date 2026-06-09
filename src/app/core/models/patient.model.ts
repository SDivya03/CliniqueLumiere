/**
 * Patient domain models for the Patient Intake module.
 * Interfaces only — no behaviour (see CLAUDE.md folder conventions).
 */

/** Selectable gender options shown in the registration form. */
export enum Gender {
  Female = 'Female',
  Male = 'Male',
  Other = 'Other',
  PreferNotToSay = 'Prefer not to say',
}

/** Optional next-of-kin contact captured during intake. */
export interface EmergencyContact {
  name: string;
  phone: string;
}

/** A patient record as returned by the API. */
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  emergencyContact: EmergencyContact | null;
  createdAt: string;
}

/** Payload sent to the API when registering a new patient (server assigns id/createdAt). */
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  emergencyContact: EmergencyContact | null;
}
