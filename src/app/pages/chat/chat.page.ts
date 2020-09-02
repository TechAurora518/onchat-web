import { Platform } from '@angular/cdk/platform';
import { KeyValue } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, Scroll } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TEXT_MSG_MAX_LENGTH } from 'src/app/common/constant';
import { ChatroomType, MessageType, SocketEvent } from 'src/app/common/enum';
import { ChatItem, Chatroom, Message, Result } from 'src/app/models/onchat.model';
import { OnChatService } from 'src/app/services/onchat.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { SocketService } from 'src/app/services/socket.service';
import { StrUtil } from 'src/app/utils/str.util';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  textMsgMaxLength: number = TEXT_MSG_MAX_LENGTH;
  msg: string = '';
  /** 当前房间名字 */
  roomName: string = '';
  /** 房间ID */
  chatroomId: number;
  /** 消息ID，用于查询指定消息段 */
  msgId: number = 0;
  /** 聊天记录 */
  msgList: Message[] = [];
  /** 是否是第一次查询 */
  first: boolean = true;
  /** 聊天记录是否查到末尾了 */
  end: boolean = false;
  /** IonContent */
  @ViewChild('ionContent', { static: true }) ionContent: IonContent;
  /** 抽屉 */
  @ViewChild('drawer', { static: true }) drawer: ElementRef;
  /** IonContent滚动元素 */
  contentElement: HTMLElement;
  /** IonContent滚动元素初始可视高度 */
  contentClientHeight: number;
  resizeTimeout: number = null;
  /** 是否有未读消息 */
  hasUnread: boolean = false;
  /** 聊天室类型 */
  chatroomType: ChatroomType = ChatroomType.Group;
  /**
   * 用户发送的消息体
   * sendTime => 在msgList中的index
   */
  sendMsgMap: Map<number, number> = new Map();
  subject: Subject<unknown> = new Subject();
  /** 是否显示抽屉 */
  showDrawer: boolean = true;
  /** 键盘高度 */
  keyboardHeight: number;
  /** 解除监听的函数集合 */
  unlistenFns: Function[] = [];

  constructor(
    public onChatService: OnChatService,
    private platform: Platform,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router,
    private renderer2: Renderer2,
    private overlayService: OverlayService
  ) { }

  ngOnInit() {
    // 监听路由 滚动事件
    // 场景：从1号房间跳到2号房间，全局房间号变成2，再返回到1号房间，全局房间号变回1
    this.router.events.pipe(filter(event => event instanceof Scroll), takeUntil(this.subject)).subscribe((event: Scroll) => {
      // 尝试从URL中提取chatroomId
      const chatroomId = +event.routerEvent.url.replace(/\/chat\//, '');
      // 如果提取到的是一个数字，并且服务中的chatroomId跟这个chatroomId不一样，则更新
      if (!isNaN(chatroomId) && this.onChatService.chatroomId != chatroomId) {
        this.onChatService.chatroomId = chatroomId;
      }
    });

    // 记录当前房间ID，用于处理聊天列表
    this.onChatService.chatroomId = this.route.snapshot.params.id;
    this.chatroomId = this.route.snapshot.params.id;

    this.loadRecords();

    // 先去聊天列表缓存里面查，看看有没有这个房间的数据
    const chatItem = this.onChatService.chatList.find((v: ChatItem) => v.chatroomId == this.chatroomId);
    if (chatItem) {
      this.roomName = chatItem.name;
      this.chatroomType = chatItem.type;
    } else { // TODO 把数据缓存下来
      this.onChatService.getChatroom(this.chatroomId).subscribe((result: Result<Chatroom>) => {
        if (result.code === 0) {
          const chatroom = result.data
          this.roomName = chatroom.name;
          this.chatroomType = chatroom.type;
        }
      });
    }

    this.socketService.on(SocketEvent.Message).pipe(takeUntil(this.subject)).subscribe((o: Result<Message>) => {
      const msg = o.data;
      // 如果请求成功，并且收到的消息是这个房间的
      if (o.code != 0 || msg.chatroomId != this.chatroomId) {
        return;
      }

      // 如果是自己发的消息
      if (msg.userId == this.onChatService.user.id) {
        const index = this.sendMsgMap.get(msg.sendTime);
        msg.avatarThumbnail = this.onChatService.user.avatarThumbnail;

        if (index >= 0) {
          this.msgList[index] = msg;
          this.sendMsgMap.delete(msg.sendTime);
        } else {
          this.msgList.push(msg);
          this.tryToScrollToBottom();
        }
      } else {
        // 如果消息不是自己的，就设为已读
        this.onChatService.readed(this.chatroomId).subscribe();
        this.msgList.push(msg);
        this.tryToScrollToBottom();
      }
    });

    this.socketService.on(SocketEvent.RevokeMsg).pipe(
      takeUntil(this.subject)
    ).subscribe((o: Result<{ chatroomId: number, msgId: number }>) => {
      // 如果请求成功，并且收到的消息是这个房间的
      if (o.code == 0 && o.data.chatroomId == this.chatroomId) {
        for (const msgItem of this.msgList) {
          if (msgItem.id == o.data.msgId) { // 移除被撤回的那条消息
            msgItem.type = MessageType.Tips;
            const name = msgItem.userId == this.onChatService.user.id ? '我' : msgItem.nickname;
            msgItem.data.content = `<a target="_blank" href="/user/card/${msgItem.userId}">${name}</a> 撤回了一条消息`;
            break;
          }
        }
      }
    });

    // TODO 重新连接时候检查还有没有未发送的
    // this.socketService.on(SocketEvent.Reconnect).pipe(takeUntil(this.subject)).subscribe(() => {

    // });
  }

  ngOnDestroy() {
    this.onChatService.chatroomId = null;
    this.subject.next();
    this.subject.complete();

    for (const unlistenFn of this.unlistenFns) {
      unlistenFn();
    }
  }

  ngAfterViewInit() {
    this.ionContent.getScrollElement().then((element: HTMLElement) => {
      this.contentElement = element;
      this.contentClientHeight = element.clientHeight;
    });

    this.unlistenFns.push(this.renderer2.listen(this.drawer.nativeElement, 'transitionend', (e: any) => {
      const clientHeight = e.target.clientHeight;
      // 只有当抽屉显示（高度不为零）的时候，做抬升滚动
      clientHeight && this.ionContent.scrollByPoint(0, clientHeight, 0);
    }));
  }

  /**
   * 滚动结束时
   */
  onIonScrollEnd() {
    // 已经有未读消息，且当前位置接近最底部了
    if (this.hasUnread && this.contentElement.scrollHeight - this.contentElement.scrollTop - this.contentElement.clientHeight <= 50) {
      this.hasUnread = false;
    }
  }

  onKeyup(e: any) {
    this.renderer2.setStyle(e.target, 'height', 'auto');
    this.renderer2.setStyle(e.target, 'height', e.target.scrollHeight + 2.5 + 'px');
    // const diff = this.contentElement.scrollHeight - this.contentElement.scrollTop - this.contentElement.clientHeight;
    // (diff <= 50 && diff >= 5) && this.scrollToBottom();
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    this.resizeTimeout = window.setTimeout(() => {
      this.upliftScroll();
    }, 100);
  }

  /**
   * 加载更多消息
   * @param event
   */
  loadMoreRecords(event: any) {
    if (this.first) {
      return this.scrollToBottom(undefined, () => {
        event.target.complete();
      });
    }
    // 暴力兼容苹果内核
    const isIos = this.platform.IOS;
    isIos && (this.ionContent.scrollY = false);
    this.loadRecords(() => {
      isIos && (this.ionContent.scrollY = true);
      event.target.complete();
    });
  }

  /**
   * 加载聊天记录
   * @param complete
   */
  loadRecords(complete?: CallableFunction) {
    if (this.end) { return complete && complete(); }

    this.onChatService.getChatRecords(this.chatroomId, this.msgId).subscribe((result: Result<Message[]>) => {
      if (result.code === 0) {
        // 按照ID排序
        // result.data.sort((a: Message, b: Message) => {
        //   return a.id - b.id;
        // });
        // this.msgList = result.data.concat(this.msgList);

        for (const msgItem of result.data) {
          this.msgList.unshift(msgItem);
        }

        // 如果是第一次查记录，就执行滚动
        this.msgId == 0 && this.scrollToBottom(0, () => {
          this.first = false;
        });

        this.msgId = this.msgList[0].id;

        // 如果返回的消息里少于10条，则代表这是最后一段消息了
        result.data.length < 15 && (this.end = true);
      } else if (result.code == 1) { // 如果没有消息
        this.end = true;
      } else if (result.code == -3) { // 如果没有权限
        this.overlayService.presentMsgToast('你还没有权限进入此聊天室！');
        this.router.navigate(['/']); // 没权限还想进来，回首页去吧
      }
      complete && complete();
    });
  }

  /**
   * 抬升滚动，用于软键盘弹起的时候
   */
  upliftScroll() {
    const diffHeight = this.contentClientHeight - this.contentElement.clientHeight;
    // 如果现在的高度与初始高度的差值是正数，则代表窗口高度变小了
    if (diffHeight > 0) {
      // 只有当抬起高度大于250像素才被认为是键盘高度
      if (diffHeight > 250) {
        this.keyboardHeight = diffHeight;
      }
      this.ionContent.scrollByPoint(0, diffHeight, 250);
    } else if (diffHeight < 0) { // 如果窗口高度变大了，就重新设置一下初始高度
      this.contentClientHeight = this.contentElement.clientHeight;
    }
  }

  /**
   * 滚到底部
   */
  scrollToBottom(duration: number = 500, complete?: CallableFunction) {
    this.ionContent.scrollToBottom(duration).then(() => {
      complete && complete();
    });
  }

  /**
   * 尝试滚动到底部
   */
  tryToScrollToBottom() {
    const canScrollToBottom = this.contentElement.scrollHeight - this.contentElement.scrollTop - this.contentElement.clientHeight <= 50;

    if (canScrollToBottom) { // 当前滚动的位置允许滚动
      this.scrollToBottom();
    } else {
      this.hasUnread = true;
    }
  }

  /**
   * 发送消息
   */
  send(textareaElement: HTMLTextAreaElement) {
    if (this.msg.length > TEXT_MSG_MAX_LENGTH) { return; }
    const msg = new Message(+this.chatroomId);
    msg.data = this.msg; // TODO 封装成一个文字消息类
    this.socketService.message(msg);

    this.sendMsgMap.set(msg.sendTime, this.msgList.length);

    this.msgList.push(Object.assign(msg, {
      userId: this.onChatService.user.id,
      avatarThumbnail: this.onChatService.user.avatarThumbnail,
      data: { content: this.msg },
      createTime: msg.sendTime,
      loading: true
    }));
    this.scrollToBottom();

    this.msg = '';

    this.renderer2.setStyle(textareaElement, 'height', 'auto');
  }

  /**
   * 是否禁用发送按钮
   */
  disableSendBtn() {
    return this.msg.length > TEXT_MSG_MAX_LENGTH;
  }

  /**
   * 是否显示发送按钮
   */
  showSendBtn() {
    return StrUtil.trimAll(this.msg).length > 0;
  }

  /**
   * 显示/隐藏抽屉
   */
  toggleDrawer() {
    setTimeout(() => {
      this.showDrawer = !this.showDrawer;
    }, 75);
  }

  /**
   * 隐藏抽屉
   */
  hideDrawer() {
    if (this.showDrawer) {
      this.showDrawer = false;
    }
  }

  /**
   * 设置好友别名
   */
  setFriendAlias() {
    // 只有私聊才可改好友别名
    if (this.chatroomType != ChatroomType.Private) {
      return;
    }

    this.overlayService.presentInputAlert('好友别名', [
      {
        name: 'alias',
        type: 'text',
        value: this.roomName,
        placeholder: '给对方起个好听的别名吧',
        cssClass: 'ipt-primary',
        attributes: {
          maxlength: 30
        }
      }
    ], (data: KeyValue<string, any>) => {
      this.onChatService.setFriendAlias(this.chatroomId, data['alias']).subscribe((result: Result) => {
        if (result.code == 0) {
          this.roomName = data['alias'];
          const index = this.onChatService.chatList.findIndex((v: ChatItem) => v.chatroomId == this.chatroomId);
          if (index >= 0) {
            this.onChatService.chatList[index].name = data['alias'];
            this.onChatService.chatList = this.onChatService.chatList;
          }
          this.overlayService.presentMsgToast('成功修改好友别名', 1000);
        } else {
          this.overlayService.presentMsgToast(result.msg);
        }
      });
    });
  }

}
