import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private themeSubject = new BehaviorSubject<Theme>('light');

  theme$ = this.themeSubject.asObservable();

  constructor() {

    const savedTheme =
        (localStorage.getItem('theme') as Theme) || 'light';

    this.setTheme(savedTheme);
  }


  toggleTheme(): void {

    const newTheme =
        this.themeSubject.value === 'light'
            ? 'dark'
            : 'light';

    this.setTheme(newTheme);
  }


  setTheme(theme: Theme): void {

    this.themeSubject.next(theme);

    localStorage.setItem('theme', theme);

    const html = document.documentElement;

    if (theme === 'dark') {

      html.classList.add('dark');

    } else {

      html.classList.remove('dark');

    }
  }
}