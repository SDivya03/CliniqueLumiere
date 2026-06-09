/**
 * Appointment domain models for the Appointments module.
 * Interfaces only — no behaviour (see CLAUDE.md folder conventions).
 */

/** A treatment service offered by the clinic. */
export interface Service {
  id: number;
  name: string;
  durationMinutes: number;
  price: number;
}

/** A clinic practitioner who delivers services. */
export interface Practitioner {
  id: number;
  firstName: string;
  lastName: string;
  specialty: string;
}

/** A booked appointment as returned by the API. */
export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  practitionerId: number;
  practitionerName: string;
  serviceId: number;
  serviceName: string;
  serviceDurationMinutes: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

/** Payload sent to POST /api/appointments. */
export interface CreateAppointmentRequest {
  patientId: number;
  practitionerId: number;
  serviceId: number;
  /** ISO 8601 UTC date-time string. */
  startTime: string;
}

/** Body of a 409 Conflict response when a booking overlaps an existing appointment (CL-2.1.2). */
export interface AppointmentConflict {
  practitionerName: string;
  /** ISO 8601 UTC date-time string. */
  conflictStart: string;
  /** ISO 8601 UTC date-time string. */
  conflictEnd: string;
}
