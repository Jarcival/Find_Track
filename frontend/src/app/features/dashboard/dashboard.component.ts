import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { SavingsService } from '../../core/services/savings.service';
import { TransactionModalComponent } from './transaction-modal.component';
import { TransactionListComponent } from './transaction-list.component';
import { Transaction, CATEGORIES } from '../../core/models/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionModalComponent, TransactionListComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  showModal = signal(false);
  activeTab = signal<'inicio' | 'graficos' | 'ahorros'>('inicio');

  // Modales de Ahorro
  savingsModalType = signal<'deposit' | 'withdraw' | 'target' | null>(null);
  savingsInputValue = signal<number | null>(null);
  savingsTargetValue = signal<number | null>(null);
  savingsTargetDateValue = signal<string>('');
  savingsError = signal<string>('');
  savingsLoading = signal<boolean>(false);

  // Instancias de Gráficos
  incomeChartInstance: Chart | null = null;
  expenseChartInstance: Chart | null = null;

  constructor(
    public authService: AuthService,
    public txService: TransactionService,
    public savingsService: SavingsService,
    private router: Router
  ) {
    // Efecto reactivo para renderizar gráficos cuando cambie de pestaña a 'graficos' o cuando cambien los datos
    effect(() => {
      const tab = this.activeTab();
      const data = this.txService.data();
      if (tab === 'graficos') {
        setTimeout(() => this.initCharts(), 50);
      }
    });
  }

  ngOnInit() {
    this.txService.getAll().subscribe();
    this.savingsService.getSavings().subscribe();
  }

  logout() {
    this.authService.logout();
  }

  openModal() { this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  setTab(tab: 'inicio' | 'graficos' | 'ahorros') {
    this.activeTab.set(tab);
  }

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

  // --- LÓGICA DE AHORRO (CAJITA NU) ---
  toggleSavingsActive() {
    const current = this.savingsService.savingsState();
    if (!current) return;
    this.savingsService.toggle(!current.active).subscribe();
  }

  openSavingsModal(type: 'deposit' | 'withdraw' | 'target') {
    this.savingsError.set('');
    this.savingsInputValue.set(null);
    if (type === 'target') {
      const current = this.savingsService.savingsState();
      this.savingsTargetValue.set(current?.target_amount ?? null);
      this.savingsTargetDateValue.set(current?.target_date ? current.target_date.split('T')[0] : '');
    }
    this.savingsModalType.set(type);
  }

  closeSavingsModal() {
    this.savingsModalType.set(null);
    this.savingsError.set('');
  }

  handleSavingsAction() {
    const type = this.savingsModalType();
    this.savingsLoading.set(true);
    this.savingsError.set('');

    if (type === 'deposit') {
      const val = this.savingsInputValue();
      if (!val || val <= 0) {
        this.savingsError.set('Ingresa un monto válido mayor a 0.');
        this.savingsLoading.set(false);
        return;
      }
      this.savingsService.deposit(val).subscribe({
        next: () => {
          this.savingsLoading.set(false);
          this.closeSavingsModal();
        },
        error: (err) => {
          this.savingsError.set(err.error?.message || 'Error al depositar.');
          this.savingsLoading.set(false);
        }
      });
    } else if (type === 'withdraw') {
      const val = this.savingsInputValue();
      if (!val || val <= 0) {
        this.savingsError.set('Ingresa un monto válido mayor a 0.');
        this.savingsLoading.set(false);
        return;
      }
      this.savingsService.withdraw(val).subscribe({
        next: () => {
          this.savingsLoading.set(false);
          this.closeSavingsModal();
        },
        error: (err) => {
          this.savingsError.set(err.error?.message || 'Error al retirar.');
          this.savingsLoading.set(false);
        }
      });
    } else if (type === 'target') {
      const amt = this.savingsTargetValue();
      const dt = this.savingsTargetDateValue();
      if (amt !== null && amt <= 0) {
        this.savingsError.set('La meta de ahorro debe ser mayor a 0.');
        this.savingsLoading.set(false);
        return;
      }
      this.savingsService.updateTarget(amt, dt || null).subscribe({
        next: () => {
          this.savingsLoading.set(false);
          this.closeSavingsModal();
        },
        error: (err) => {
          this.savingsError.set(err.error?.message || 'Error al actualizar la meta.');
          this.savingsLoading.set(false);
        }
      });
    }
  }

  getDailyYield(balance: number): number {
    return (balance * 0.15) / 365;
  }

  getMonthlyYield(balance: number): number {
    return (balance * 0.15) / 12;
  }

  getYearlyYield(balance: number): number {
    return balance * 0.15;
  }

  getGoalProgress(balance: number, target: number | null | undefined): number {
    if (!target || target <= 0) return 0;
    const progress = (balance / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  getDaysRemaining(targetDateStr: string | null | undefined): number {
    if (!targetDateStr) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // --- LÓGICA DE GRÁFICOS (CHART.JS) ---
  initCharts() {
    // Destruir gráficos anteriores
    if (this.incomeChartInstance) {
      this.incomeChartInstance.destroy();
      this.incomeChartInstance = null;
    }
    if (this.expenseChartInstance) {
      this.expenseChartInstance.destroy();
      this.expenseChartInstance = null;
    }

    const txs = this.txService.data().transactions;
    const incomeTxs = txs.filter(t => t.type === 'INCOME');
    const expenseTxs = txs.filter(t => t.type === 'EXPENSE');

    // Procesar datos para ingresos
    const incomeCategoriesMap: { [key: string]: number } = {};
    incomeTxs.forEach(t => {
      incomeCategoriesMap[t.category] = (incomeCategoriesMap[t.category] || 0) + Number(t.amount);
    });

    // Procesar datos para gastos
    const expenseCategoriesMap: { [key: string]: number } = {};
    expenseTxs.forEach(t => {
      expenseCategoriesMap[t.category] = (expenseCategoriesMap[t.category] || 0) + Number(t.amount);
    });

    const hasIncomes = Object.keys(incomeCategoriesMap).length > 0;
    const hasExpenses = Object.keys(expenseCategoriesMap).length > 0;

    if (hasIncomes) {
      const incomeCanvas = document.getElementById('incomeChart') as HTMLCanvasElement;
      if (incomeCanvas) {
        this.incomeChartInstance = new Chart(incomeCanvas, {
          type: 'doughnut',
          data: {
            labels: Object.keys(incomeCategoriesMap),
            datasets: [{
              data: Object.values(incomeCategoriesMap),
              backgroundColor: [
                '#63dca4', // Menta
                '#6366f1', // Índigo
                '#f59e0b', // Ámbar
                '#3b82f6', // Azul
                '#ec4899', // Rosa
                '#10b981', // Esmeralda
                '#8b5cf6', // Púrpura
                '#f97316'  // Naranja
              ],
              borderColor: '#161b22',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#e6edf3',
                  font: { family: 'DM Sans', size: 11 },
                  boxWidth: 12
                }
              }
            }
          }
        });
      }
    }

    if (hasExpenses) {
      const expenseCanvas = document.getElementById('expenseChart') as HTMLCanvasElement;
      if (expenseCanvas) {
        this.expenseChartInstance = new Chart(expenseCanvas, {
          type: 'doughnut',
          data: {
            labels: Object.keys(expenseCategoriesMap),
            datasets: [{
              data: Object.values(expenseCategoriesMap),
              backgroundColor: [
                '#ff7070', // Rojo claro
                '#a855f7', // Púrpura
                '#0ea5e9', // Celeste
                '#facc15', // Amarillo
                '#14b8a6', // Teal
                '#ec4899', // Rosa
                '#f97316', // Naranja
                '#3b82f6', // Azul real
                '#84cc16', // Lima
                '#ef4444'  // Rojo intenso
              ],
              borderColor: '#161b22',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#e6edf3',
                  font: { family: 'DM Sans', size: 11 },
                  boxWidth: 12
                }
              }
            }
          }
        });
      }
    }
  }
}