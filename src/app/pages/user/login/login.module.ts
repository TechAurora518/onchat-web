import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActiveClassModule } from 'src/app/modules/active-class.module';
import { RippleModule } from 'src/app/modules/ripple.module';
import { LoginPageRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    LoginPageRoutingModule,
    ActiveClassModule,
    RippleModule
  ],
  declarations: [LoginPage]
})
export class LoginPageModule { }
