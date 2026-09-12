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
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-checkbox',
  imports: [
    CommonModule
  ],
  template: `
    <label
      class="flex items-center space-x-3 group cursor-pointer"
      [ngClass]="{
        'cursor-not-allowed opacity-60': disabled
      }"
    >

      <div class="relative w-5 h-5">

        <input
          [id]="id"
          type="checkbox"
          class="w-5 h-5 appearance-none cursor-pointer dark:border-gray-700 border border-gray-300 checked:border-transparent rounded-md checked:bg-brand-500 disabled:opacity-60"
          [ngClass]="className"
          [checked]="checked"
          (change)="onChangeEvent($event)"
          (blur)="handleBlur()"
          [disabled]="disabled"
        />

        @if (checked) {

          <svg
            class="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="white"
              stroke-width="1.94437"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

        }

        @if (disabled) {

          <svg
            class="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
              stroke="#E4E7EC"
              stroke-width="2.33333"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>

        }

      </div>

      @if (label) {

        <span
          class="text-sm font-medium text-gray-800 dark:text-gray-200"
        >
          {{ label }}
        </span>

      }

    </label>
  `,
  styles: ``,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent
    implements ControlValueAccessor {

  @Input() label?: string;
  @Input() checked: boolean = false;
  @Input() className: string = '';
  @Input() id?: string;
  @Input() disabled: boolean = false;

  /*
   * IMPORTANT :
   * On garde checkedChange pour les composants
   * existants qui utilisent [(checked)].
   */
  @Output() checkedChange =
      new EventEmitter<boolean>();

  /*
   * Fonctions Angular Forms
   */
  private onChange: (value: boolean) => void =
      () => {};

  private onTouched: () => void =
      () => {};

  /**
   * ControlValueAccessor
   */
  writeValue(value: boolean | null): void {
    this.checked = value ?? false;
  }

  /**
   * ControlValueAccessor
   */
  registerOnChange(
      fn: (value: boolean) => void
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
   * Changement de la checkbox
   */
  onChangeEvent(event: Event): void {

    const input =
        event.target as HTMLInputElement;

    this.checked = input.checked;

    /*
     * Ancienne API du projet
     */
    this.checkedChange.emit(this.checked);

    /*
     * Nouvelle API Angular Forms
     */
    this.onChange(this.checked);
  }

  /**
   * Perte du focus
   */
  handleBlur(): void {
    this.onTouched();
  }
}