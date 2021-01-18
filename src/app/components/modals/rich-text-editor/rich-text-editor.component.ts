import { Component, Input, OnInit } from '@angular/core';
import { NavigationCancel, Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { ContentChange } from 'ngx-quill';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TEXT_MSG_MAX_LENGTH } from 'src/app/common/constant';
import { LocalStorageKey, MessageType, ResultCode, SocketEvent } from 'src/app/common/enum';
import { RichTextMessage } from 'src/app/models/form.model';
import { Message, Result } from 'src/app/models/onchat.model';
import { ChatPage } from 'src/app/pages/chat/chat.page';
import { GlobalData } from 'src/app/services/global-data.service';
import { LocalStorage } from 'src/app/services/local-storage.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { SocketService } from 'src/app/services/socket.service';
import { StrUtil } from 'src/app/utils/str.util';

@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss'],
})
export class RichTextEditorComponent implements OnInit {
  @Input() page: ChatPage;

  html: string;
  text: string = '';
  subject: Subject<unknown> = new Subject();
  throttleTimer: number = null;

  modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      ['clean'],
    ]
  };

  constructor(
    public globalData: GlobalData,
    private localStorage: LocalStorage,
    private overlayService: OverlayService,
    private socketService: SocketService,
    private modalController: ModalController,
    private router: Router
  ) { }

  ngOnInit() {
    this.globalData.canDeactivate = false;

    this.html = this.localStorage.getItemFromMap(LocalStorageKey.ChatRichTextMap, this.globalData.chatroomId);

    this.router.events.pipe(
      filter(event => event instanceof NavigationCancel),
      takeUntil(this.subject)
    ).subscribe(() => this.dismiss());
  }

  /**
   * 关闭自己
   */
  dismiss() {
    setTimeout(() => {
      this.modalController.dismiss();
      this.globalData.canDeactivate = true;
      StrUtil.trimAll(this.text).length && this.cache();
    }, 50);
  }

  showSendBtn() {
    return StrUtil.trimAll(this.text).length > 0;
  }

  /**
   * 发送
   */
  send() {
    if (this.text.length > TEXT_MSG_MAX_LENGTH) {
      return this.overlayService.presentToast('字数超出上限！');
    }

    const loading = this.overlayService.presentLoading('Sending…');

    const message = new Message(+this.globalData.chatroomId, MessageType.RichText);

    const subscription = this.socketService.on(SocketEvent.Message).subscribe((result: Result<Message>) => {
      const msg = result.data;
      // 如果请求成功，并且收到的消息是这个房间的
      if (result.code !== ResultCode.Success || msg.chatroomId != this.globalData.chatroomId) {
        return subscription.unsubscribe();
      }

      // 如果是自己发的消息，并且是刚刚这一条
      if (msg.userId == this.globalData.user.id && msg.sendTime == message.sendTime) {
        this.text = '';
        this.throttleTimer && clearTimeout(this.throttleTimer);
        this.localStorage.removeItemFromMap(LocalStorageKey.ChatRichTextMap, this.globalData.chatroomId);

        loading.then((loading: HTMLIonLoadingElement) => {
          loading.dismiss()
          this.dismiss();
          this.page.scrollToBottom();
        });

        subscription.unsubscribe();
      }
    });

    message.data = new RichTextMessage(this.html, this.text);
    this.socketService.message(message);
  }

  /**
   * 富文本变化时
   */
  onContentChanged(event: ContentChange) {
    this.text = event.text;

    if (this.throttleTimer === null && StrUtil.trimAll(this.text).length) {
      this.throttleTimer = window.setTimeout(() => {
        this.cache();
        this.throttleTimer = null;
      }, 3000);
    }
  }

  /**
   * 缓存编辑的富文本到本地
   */
  cache() {
    this.throttleTimer && clearTimeout(this.throttleTimer);
    this.localStorage.setItemToMap(
      LocalStorageKey.ChatRichTextMap,
      this.globalData.chatroomId,
      this.html
    );
  }

}
