import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { CreateTransactionDto, TransactionsResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly API = 'http://localhost:3000/api/transactions';

  // Estado reactivo con signals
  data = signal<TransactionsResponse>({
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    transactions: []
  });

  loading = signal(false);

  constructor(private http: HttpClient) {}

  getAll() {
    this.loading.set(true);
    return this.http.get<TransactionsResponse>(this.API).pipe(
      tap(res => {
        this.data.set(res);
        this.loading.set(false);
      })
    );
  }

  create(dto: CreateTransactionDto) {
    return this.http.post<{ message: string; transaction: any }>(this.API, dto).pipe(
      tap(() => this.getAll().subscribe())
    );
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${this.API}/${id}`).pipe(
      tap(() => this.getAll().subscribe())
    );
  }
}