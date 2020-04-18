import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment as env } from '../../environments/environment';
import { ChatItem, Chatroom, MsgItem } from '../models/entity.model';
import { Login, Register } from '../models/form.model';
import { Result } from '../models/interface.model';
import { LocalStorageService } from './local-storage.service';

const HTTP_OPTIONS_JSON = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json;charset=UTF-8' }),
  withCredentials: true
};

const HTTP_OPTIONS_FORM = {
  headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }),
  withCredentials: true
};

@Injectable({
  providedIn: 'root'
})
export class OnChatService {
  /** 缓存登录状态 */
  isLogin: boolean = null;
  /** 缓存用户ID */
  userId: number = null;
  /** 记录当前所在的聊天室ID */
  chatroomId: number = null;
  /** 缓存聊天列表 */
  private _chatList: ChatItem[] = [];
  set chatList(chatList: ChatItem[]) {
    this._chatList = sortChatList(chatList);
    this.localStorageService.set(env.chatListKey, this.chatList);
  }
  get chatList(): ChatItem[] {
    return this._chatList;
  }

  constructor(private http: HttpClient, private localStorageService: LocalStorageService,) { }

  init() {
    // 先加载缓存
    const data = this.localStorageService.get(env.chatListKey);
    if (data) { this.chatList = data; }

    this.getChatList().subscribe((result: Result<ChatItem[]>) => {
      this.chatList = result.data;
      this.localStorageService.set(env.chatListKey, this.chatList);
    });

    this.userId == null && this.getUserId().subscribe((o: Result<number>) => {
      if (o.code == 0) { this.userId = o.data; }
    });
  }

  getUsernameByUid(uid: number) {
    return this.http.get('/api/php/history.php?history=' + uid, HTTP_OPTIONS_JSON);
  }

  /**
   * 登录
   * @param o 
   */
  login(o: Login): Observable<Result<number>> {
    return this.http.post<Result<null>>(env.userLoginUrl, o, HTTP_OPTIONS_JSON);
  }

  /**
   * 登出
   */
  logout(): Observable<null> {
    return this.http.get<null>(env.userLogoutUrl);
  }

  /**
   * 检测是否已经登录
   */
  checkLogin(): Observable<Result<boolean>> {
    return this.http.get<Result<boolean>>(env.userCheckLoginUrl);
  }

  /**
   * 注册
   * @param o 
   */
  register(o: Register): Observable<Result<number>> {
    return this.http.post<Result<null>>(env.userRegisterUrl, o, HTTP_OPTIONS_JSON);
  }

  /**
   * 获取用户ID
   */
  getUserId(): Observable<Result<number>> {
    return this.http.get<Result<number>>(env.userIdUrl);
  }

  /**
   * 获取该用户下所有聊天室
   */
  getChatrooms(): Observable<Result<Chatroom[]>> {
    return this.http.get<Result<Chatroom[]>>(env.userChatroomsUrl);
  }

  /**
   * 获取用户的聊天列表
   */
  getChatList(): Observable<Result<ChatItem[]>> {
    return this.http.get<Result<ChatItem[]>>(env.userChatListUrl);
  }

  /**
   * 获取聊天室名称
   * @param id 聊天室ID
   */
  getChatroomName(id: number): Observable<Result<string>> {
    return this.http.get<Result<string>>(env.chatroomUrl + id + '/name');
  }

  /**
   * 获取聊天记录
   * @param id 聊天室ID
   * @param msgId 页码
   */
  getChatRecords(id: number, msgId?: number): Observable<Result<MsgItem[]>> {
    return this.http.get<Result<MsgItem[]>>(env.chatroomUrl + id + '/records/' + msgId);
  }

  /**
   * 置顶聊天列表子项
   * @param id 聊天列表子项ID
   */
  stickyChatItem(id: number): Observable<Result<null>> {
    return this.http.put<Result<null>>(env.chatListStickyUrl + id, null);
  }

  /**
   * 取消置顶聊天列表子项
   * @param id 聊天列表子项ID
   */
  unstickyChatItem(id: number): Observable<Result<null>> {
    return this.http.put<Result<null>>(env.chatListUnstickyUrl + id, null);
  }

  /**
   * 将聊天列表子项设为已读
   * @param id 聊天列表子项ID
   */
  readed(id: number): Observable<Result<null>> {
    return this.http.put<Result<null>>(env.chatListReadedUrl + id, null);
  }

  /**
   * 将聊天列表子项设为未读
   * @param id 聊天列表子项ID
   */
  unread(id: number): Observable<Result<null>> {
    return this.http.put<Result<null>>(env.chatListUnreadUrl + id, null);
  }
}

/**
 * 按照时间/置顶顺序排序聊天列表
 * @param chatList 
 */
export function sortChatList(chatList: ChatItem[]): ChatItem[] {
  chatList.sort((a: ChatItem, b: ChatItem) => {
    return b.updateTime - a.updateTime;
  });

  chatList.sort((a: ChatItem, b: ChatItem) => {
    return +b.sticky - +a.sticky;
  });

  return chatList;
}
