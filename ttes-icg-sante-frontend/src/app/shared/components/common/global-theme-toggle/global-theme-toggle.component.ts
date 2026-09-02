import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../services/theme.service';

@Component({
    selector: 'app-global-theme-toggle',
    standalone: true,
    template: `
    <button
      type="button"
      (click)="toggleTheme()"
      [attr.aria-label]="isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'"
      class="fixed bottom-6 right-6 z-[9999]
             flex h-14 w-14 items-center justify-center
             rounded-full
             bg-green-600
             text-2xl text-white
             shadow-lg
             transition-all duration-300
             hover:scale-110
             hover:bg-green-700
             focus:outline-none
             focus:ring-4
             focus:ring-green-500/30
             dark:bg-green-500
             dark:hover:bg-green-400">

      @if (isDarkMode) {
        ☀️
      } @else {
        ☾
      }

    </button>
  `
})
export class GlobalThemeToggleComponent {

    private themeService = inject(ThemeService);

    isDarkMode = false;

    constructor() {
        this.themeService.theme$.subscribe(theme => {
            this.isDarkMode = theme === 'dark';
        });
    }

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}