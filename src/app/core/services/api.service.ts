import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreatePatientRequest, Patient } from '../models/patient.model';
import {
  Appointment,
  CreateAppointmentRequest,
  Practitioner,
  Service,
} from '../models/appointment.model';

/** Base URL of the Clinique Lumière REST API (ASP.NET Core backend, see backend/Properties/launchSettings.json). */
const API_BASE = 'http://localhost:5050/api';

/**
 * Thin HttpClient wrapper for the backend REST API.
 * Holds no state and performs no error handling — callers (feature services)
 * own state and error handling so components stay free of both.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /** Register a new patient. Resolves with the created record on success. */
  createPatient(payload: CreatePatientRequest): Observable<Patient> {
    return this.http.post<Patient>(`${API_BASE}/patients`, payload);
  }

  /** Fetch all registered patients, optionally filtered by a search term (name or email). */
  getPatients(search?: string): Observable<Patient[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Patient[]>(`${API_BASE}/patients`, { params });
  }

  /** Fetch all services in the clinic catalogue. */
  getServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${API_BASE}/services`);
  }

  /** Fetch all practitioners. */
  getPractitioners(): Observable<Practitioner[]> {
    return this.http.get<Practitioner[]>(`${API_BASE}/practitioners`);
  }

  /** Book a new appointment. Resolves with the created record on success. */
  createAppointment(payload: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${API_BASE}/appointments`, payload);
  }
}
