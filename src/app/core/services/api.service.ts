import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CreatePatientRequest, Patient, UpdatePatientRequest } from '../models/patient.model';

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

  /** Fetch all registered patients. */
  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${API_BASE}/patients`);
  }

  /** Update an existing patient. Resolves with the updated record on success. */
  updatePatient(id: number, payload: UpdatePatientRequest): Observable<Patient> {
    return this.http.put<Patient>(`${API_BASE}/patients/${id}`, payload);
  }
}
