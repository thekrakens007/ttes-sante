import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Tier {
  level: number;
  threshold: number;
  rewardLabel: string;
  unlocked: boolean;
}

interface Gauge {
  points: number;
  currentLevel: number | null;
  nextThreshold: number | null;
  tiers: Tier[];
}

interface ReferralSummary {
  referralCode: string;
  referredCount: number;
  signupGauge: Gauge;
  purchaseGauge: Gauge;
}

@Component({
  selector: 'app-referral',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-3xl p-6" *ngIf="summary">
      <h1 class="mb-2 text-2xl font-semibold">Parrainage & récompenses</h1>
      <p class="mb-4 text-gray-600">
        Partagez votre lien : vous gagnez des points pour chaque personne qui
        crée un compte, puis pour ses achats livrés.
      </p>

      <div class="mb-6 flex items-center gap-2 rounded-lg border p-3">
        <input class="flex-1 bg-transparent" readonly [value]="link" />
        <button class="rounded bg-brand-500 px-3 py-1 text-white" (click)="copy()">
          {{ copied ? 'Copié !' : 'Copier' }}
        </button>
      </div>

      <p class="mb-6">Personnes parrainées : <strong>{{ summary.referredCount }}</strong></p>

      <ng-container *ngFor="let g of gauges()">
        <h2 class="mb-1 text-lg font-medium">{{ g.title }}</h2>
        <div class="mb-1 h-3 w-full overflow-hidden rounded bg-gray-200">
          <div class="h-3 bg-green-500" [style.width.%]="progress(g.gauge)"></div>
        </div>
        <p class="mb-2 text-sm text-gray-600">
          {{ g.gauge.points }} points
          <span *ngIf="g.gauge.nextThreshold">— prochain palier : {{ g.gauge.nextThreshold }}</span>
        </p>
        <ul class="mb-6 text-sm">
          <li *ngFor="let t of g.gauge.tiers" [class.font-semibold]="t.unlocked">
            {{ t.unlocked ? '✅' : '🔒' }} {{ t.threshold }} pts — {{ t.rewardLabel }}
          </li>
        </ul>
      </ng-container>
    </div>
  `
})
export class ReferralComponent implements OnInit {

  private http = inject(HttpClient);

  summary: ReferralSummary | null = null;
  link = '';
  copied = false;

  ngOnInit(): void {
    this.http.get<ReferralSummary>('/api/referral/me').subscribe(s => {
      this.summary = s;
      this.link = `${window.location.origin}/signup?ref=${s.referralCode}`;
    });
  }

  gauges(): { title: string; gauge: Gauge }[] {
    return [
      { title: 'Jauge inscriptions', gauge: this.summary!.signupGauge },
      { title: 'Jauge achats', gauge: this.summary!.purchaseGauge }
    ];
  }

  progress(g: Gauge): number {
    const prev = [...g.tiers].reverse().find(t => t.unlocked)?.threshold ?? 0;
    if (!g.nextThreshold) {
      return 100;
    }
    return ((g.points - prev) / (g.nextThreshold - prev)) * 100;
  }

  copy(): void {
    navigator.clipboard.writeText(this.link);
    this.copied = true;
  }
}
