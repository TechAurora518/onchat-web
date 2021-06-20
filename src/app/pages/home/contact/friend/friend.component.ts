import { Component } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { ResultCode } from 'src/app/common/enum';
import { ChatSession, Result } from 'src/app/models/onchat.model';
import { ApiService } from 'src/app/services/api.service';
import { GlobalData } from 'src/app/services/global-data.service';
import { EntityUtil } from 'src/app/utils/entity.util';
import { SysUtil } from 'src/app/utils/sys.util';

@Component({
  selector: 'app-friend',
  templateUrl: './friend.component.html',
  styleUrls: ['./friend.component.scss'],
})
export class FriendComponent implements ViewWillEnter {
  /** 虚拟列表项目高度 */
  itemHeight: number = SysUtil.rem2px(4.425);
  getItemHeight: () => number = () => this.itemHeight;
  trackByFn = EntityUtil.trackBy;

  constructor(
    private apiService: ApiService,
    public globalData: GlobalData,
  ) { }

  ionViewWillEnter() {
    // 如果为空，就加载
    this.globalData.privateChatrooms || this.apiService.getPrivateChatrooms().pipe(
      filter(({ code }: Result) => code === ResultCode.Success)
    ).subscribe(({ data }: Result<ChatSession[]>) => {
      this.globalData.privateChatrooms = data;
    });
  }

}
