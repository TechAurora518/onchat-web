import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { SessionStorageKey } from '../common/enum';
import { Result, User } from '../models/onchat.model';
import { GlobalDataService } from '../services/global-data.service';
import { OnChatService } from '../services/onchat.service';
import { SessionStorageService } from '../services/session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanLoad {
  constructor(
    private onChatService: OnChatService,
    private globalDataService: GlobalDataService,
    private sessionStorageService: SessionStorageService,
    private router: Router
  ) { }

  canLoad(route: Route, segments: UrlSegment[]): boolean | Promise<boolean> | Observable<boolean> {
    if (this.globalDataService.user !== null) { return true; }

    return new Observable(observer => {
      this.onChatService.checkLogin().subscribe((result: Result<boolean | User>) => {
        if (result.data) {
          const user = result.data as User;
          this.globalDataService.user = user;
          this.sessionStorageService.setItemToMap(
            SessionStorageKey.UserMap,
            user.id,
            user
          );
        } else {
          this.router.navigate(['/user/login']); // 返回登录页面
        }

        observer.next(!!result.data);
        observer.complete();
      }, () => {
        observer.next(false);
        observer.complete();
      });
    });
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (this.globalDataService.user !== null) { return true; }

    return new Observable(observer => {
      this.onChatService.checkLogin().subscribe((result: Result<boolean | User>) => {
        if (result.data) {
          const user = result.data as User;
          this.globalDataService.user = user;
          this.sessionStorageService.setItemToMap(
            SessionStorageKey.UserMap,
            user.id,
            user
          );
        } else {
          this.router.navigate(['/user/login']); // 返回登录页面
        }

        observer.next(!!result.data);
        observer.complete();
      }, () => {
        observer.next(false);
        observer.complete();
      });
    });
  }

}
