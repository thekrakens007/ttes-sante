import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Tier {
  id?: number;
  gauge: 'SIGNUP' | 'PURCHASE';
  level: number;
  threshold: number;
  rewardLabel: string;
}

@Component({
  selector: 'app-admin-referral-tiers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <h1 class="mb-4 text-2xl font-semibold">Récompenses de parrainage</h1>
      <p class="mb-4 text-gray-600">Modifiez à tout moment les paliers et les récompenses de chaque jauge.</p>

      <table class="mb-6 w-full text-sm">
        <thead>
          <tr class="text-left">
            <th>Jauge</th><th>Niveau</th><th>Seuil (pts)</th><th>Récompense</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tiers">
            <td>
              <select [(ngModel)]="t.gauge" class="rounded border p-1">
                <option value="SIGNUP">Inscriptions</option>
                <option value="PURCHASE">Achats</option>
              </select>
            </td>
            <td><input type="number" [(ngModel)]="t.level" class="w-16 rounded border p-1" /></td>
            <td><input type="number" [(ngModel)]="t.threshold" class="w-24 rounded border p-1" /></td>
            <td><input [(ngModel)]="t.rewardLabel" class="w-full rounded border p-1" /></td>
            <td class="whitespace-nowrap">
              <button class="mr-2 rounded bg-brand-500 px-2 py-1 text-white" (click)="save(t)">Enregistrer</button>
              <button class="rounded bg-red-500 px-2 py-1 text-white" (click)="remove(t)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>

      <button class="rounded border px-3 py-1" (click)="add()">+ Ajouter un palier</button>
      <p class="mt-3 text-red-600" *ngIf="error">{{ error }}</p>
    </div>
  `
})
export class AdminReferralTiersComponent implements OnInit {

  private http = inject(HttpClient);
  private readonly URL = '/api/admin/referral-tiers';

  tiers: Tier[] = [];
  error = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.http.get<Tier[]>(this.URL).subscribe(t => this.tiers = t);
  }

  add(): void {
    this.tiers.push({ gauge: 'SIGNUP', level: 1, threshold: 50, rewardLabel: '' });
  }

  save(t: Tier): void {
    this.error = '';
    const req = t.id
      ? this.http.put<Tier>(`${this.URL}/${t.id}`, t)
      : this.http.post<Tier>(this.URL, t);
    req.subscribe({
      next: () => this.load(),
      error: e => this.error = e?.error?.message || 'Enregistrement impossible.'
    });
  }

  remove(t: Tier): void {
    if (!t.id) {
      this.tiers = this.tiers.filter(x => x !== t);
      return;
    }
    this.http.delete(`${this.URL}/${t.id}`).subscribe(() => this.load());
  }
}
