import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction, CATEGORIES } from '../../core/models/models';
import { TransactionService } from '../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent {
  @Input() transactions: Transaction[] = [];

  confirmDeleteId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  constructor(private txService: TransactionService) {}

  getCategoryIcon(category: string): string {
    return CATEGORIES.find(c => c.value === category)?.icon ?? '📦';
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  askDelete(id: number) {
    this.confirmDeleteId.set(id);
  }

  cancelDelete() {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: number) {
    this.deletingId.set(id);
    this.txService.delete(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      }
    });
  }
}