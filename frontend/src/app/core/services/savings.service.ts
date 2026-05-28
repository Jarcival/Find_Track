import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Savings } from '../models/models';
import { TransactionService } from './transaction.service';
import { API_BASE_URL } from '../config/config';

@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly API = `${API_BASE_URL}/savings`;

  // Estado reactivo de los ahorros
  savingsState = signal<Savings | null>(null);
  loading = signal(false);

  constructor(
    private http: HttpClient,
    private txService: TransactionService
  ) {}

  getSavings() {
    this.loading.set(true);
    return this.http.get<Savings>(this.API).pipe(
      tap(res => {
        this.savingsState.set(res);
        this.loading.set(false);
      })
    );
  }

  toggle(active: boolean) {
    this.loading.set(true);
    return this.http.post<{ message: string; savings: Savings }>(`${this.API}/toggle`, { active }).pipe(
      tap(res => {
        this.savingsState.set(res.savings);
        this.loading.set(false);
      })
    );
  }

  updateTarget(target_amount: number | null, target_date: string | null) {
    this.loading.set(true);
    return this.http.post<{ message: string; savings: Savings }>(`${this.API}/target`, { target_amount, target_date }).pipe(
      tap(res => {
        this.savingsState.set(res.savings);
        this.loading.set(false);
      })
    );
  }

  deposit(amount: number) {
    this.loading.set(true);
    return this.http.post<{ message: string; savings: Savings }>(`${this.API}/deposit`, { amount }).pipe(
      tap(res => {
        this.savingsState.set(res.savings);
        // Recargar transacciones para actualizar el saldo disponible
        this.txService.getAll().subscribe();
        this.loading.set(false);
      })
    );
  }

  withdraw(amount: number) {
    this.loading.set(true);
    return this.http.post<{ message: string; savings: Savings }>(`${this.API}/withdraw`, { amount }).pipe(
      tap(res => {
        this.savingsState.set(res.savings);
        // Recargar transacciones para actualizar el saldo disponible
        this.txService.getAll().subscribe();
        this.loading.set(false);
      })
    );
  }
}
