import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-input-field',
  imports: [
    CommonModule,
    FormsModule
  ],
  template: `
    <div class="relative">
      <input
        [type]="type"
        [id]="id"
        [name]="name"
        [placeholder]="placeholder"
        [value]="value"
        [min]="min"
        [max]="max"
        [step]="step"
        [disabled]="disabled"
        [ngClass]="inputClasses"
        (input)="onInput($event)"
        (blur)="handleBlur()"
      />

      @if (hint) {
        <p
          class="mt-1.5 text-xs"
          [ngClass]="{
            'text-error-500': error,
            'text-success-500': success,
            'text-gray-500': !error && !success
          }"
        >
          {{ hint }}
        </p>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ]
})
export class InputFieldComponent implements ControlValueAccessor {

  @Input() type: string = 'text';
  @Input() id: string = '';
  @Input() name: string = '';
  @Input() placeholder: string = '';

  /*
   * IMPORTANT :
   * On garde value comme @Input
   * car plusieurs composants du projet
   * utilisent [value]="..."
   */
  @Input() value: string | number = '';

  @Input() min?: string;
  @Input() max?: string;
  @Input() step?: number;

  @Input() disabled: boolean = false;
  @Input() success: boolean = false;
  @Input() error: boolean = false;
  @Input() hint?: string;
  @Input() className: string = '';

  /*
   * IMPORTANT :
   * On garde valueChange pour ne pas casser
   * les composants existants du projet.
   */
  @Output() valueChange =
      new EventEmitter<string | number>();

  /*
   * Fonctions Angular Forms
   */
  private onChange: (value: string | number) => void =
      () => {};

  private onTouched: () => void =
      () => {};

  /**
   * Classes CSS
   */
  get inputClasses(): string {

    let inputClasses =
        `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${this.className}`;

    if (this.disabled) {

      inputClasses +=
          ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;

    } else if (this.error) {

      inputClasses +=
          ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;

    } else if (this.success) {

      inputClasses +=
          ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;

    } else {

      inputClasses +=
          ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
    }

    return inputClasses;
  }

  /**
   * ControlValueAccessor
   *
   * Angular écrit une valeur dans le composant.
   */
  writeValue(value: string | number | null): void {
    this.value = value ?? '';
  }

  /**
   * ControlValueAccessor
   *
   * Angular nous donne la fonction à appeler
   * lorsque la valeur change.
   */
  registerOnChange(
      fn: (value: string | number) => void
  ): void {
    this.onChange = fn;
  }

  /**
   * ControlValueAccessor
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * ControlValueAccessor
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Changement de valeur du champ
   */
  onInput(event: Event): void {

    const input =
        event.target as HTMLInputElement;

    const newValue =
        this.type === 'number'
            ? +input.value
            : input.value;

    /*
     * Mise à jour de la valeur interne
     */
    this.value = newValue;

    /*
     * Ancienne API du projet
     */
    this.valueChange.emit(newValue);

    /*
     * Nouvelle API Angular Forms
     */
    this.onChange(newValue);
  }

  /**
   * Perte du focus
   */
  handleBlur(): void {
    this.onTouched();
  }
}