import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatroomResolve } from 'src/app/resolvers/chatroom.resolver';
import { HomePage } from './home.page';

const routes: Routes = [
  {
    path: ':chatroomId',
    component: HomePage,
    resolve: {
      chatroom: ChatroomResolve
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomePageRoutingModule { }
