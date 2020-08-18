import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from 'src/app/modules/shared.module';
import { CardPageRoutingModule } from './card-routing.module';
import { CardPage } from './card.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    CardPageRoutingModule,
    SharedModule
  ],
  declarations: [CardPage]
})
export class CardPageModule { }
