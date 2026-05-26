import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { CATEGORIES, TransactionType } from '../../core/models/models';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-modal.component.html',
  styleUrls: ['./transaction-modal.component.css']
})
export class TransactionModalComponent {
  @Output() closed = new EventEmitter<void>();

  categories = CATEGORIES;
  loading = signal(false);
  errorMsg = signal('');
  selectedType = signal<TransactionType>('EXPENSE');

  form = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    type: ['EXPENSE', Validators.required],
    category: ['', Validators.required],
    description: [''],
    date: [new Date().toISOString().split('T')[0], Validators.required]
  });

  constructor(private fb: FormBuilder, private txService: TransactionService) {}

  setType(type: TransactionType) {
    this.selectedType.set(type);
    this.form.patchValue({ type });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');
    const { amount, type, category, description, date } = this.form.value;
    this.txService.create({
      amount: Number(amount),
      type: type as TransactionType,
      category: category!,
      description: description || '',
      date: date!
    }).subscribe({
      next: () => this.closed.emit(),
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Error al guardar.');
        this.loading.set(false);
      }
    });
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.hasError(error) && ctrl?.touched);
  }

  close() { this.closed.emit(); }
}