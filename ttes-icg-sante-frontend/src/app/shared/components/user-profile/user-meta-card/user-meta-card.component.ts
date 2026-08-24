import { Component, Input } from '@angular/core';

import { ModalService } from '../../../services/modal.service';

import { ModalComponent } from '../../ui/modal/modal.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import {User} from "../../../../core/models/user.model";


@Component({
  selector: 'app-user-meta-card',
  imports: [
  ],
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent {

  @Input() user!: User;

  constructor(public modal: ModalService) {}

  isOpen = false;

  openModal(): void {
    this.isOpen = true;
  }

  closeModal(): void {
    this.isOpen = false;
  }

  handleSave(): void {

    console.log(
        'Modification meta utilisateur :',
        this.user
    );

    this.closeModal();
  }
}