import { Component, Inject } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { WINDOW } from 'src/app/common/tokens';
import { ChatSession, Result } from 'src/app/models/onchat.model';
import { UserService } from 'src/app/services/apis/user.service';
import { GlobalData } from 'src/app/services/global-data.service';
import { CssUtils } from 'src/app/utilities/css.utils';

@Component({
  selector: 'app-friend',
  templateUrl: './friend.component.html',
  styleUrls: ['./friend.component.scss'],
})
export class FriendComponent implements ViewWillEnter {
  /** 虚拟列表项目高度 */
  itemHeight: number = CssUtils.rem2px(4.425);

  minBufferPx: number = this.window.innerHeight * 1.5;
  maxBufferPx: number = this.window.innerHeight * 2;

  constructor(
    private userService: UserService,
    public globalData: GlobalData,
    @Inject(WINDOW) private window: Window,
  ) { }

  ionViewWillEnter() {
    // 如果为空，就加载
    this.globalData.privateChatrooms || this.userService.getPrivateChatrooms().subscribe(({ data }: Result<ChatSession[]>) => {
      this.globalData.privateChatrooms = data;
    });
  }

}
