import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { TransactionModalComponent } from './transaction-modal.component';
import { TransactionListComponent } from './transaction-list.component';
import { Transaction, CATEGORIES } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TransactionModalComponent, TransactionListComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  showModal = signal(false);

  constructor(
    public authService: AuthService,
    public txService: TransactionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.txService.getAll().subscribe();
  }

  logout() {
    this.authService.logout();
  }

  openModal() { this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  getCategoryIcon(category: string): string {
    return CATEGORIES.find(c => c.value === category)?.icon ?? '📦';
  }

  get balanceClass(): string {
    const b = this.txService.data().balance;
    if (b > 0) return 'positive';
    if (b < 0) return 'negative';
    return 'neutral';
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val);
  }
}