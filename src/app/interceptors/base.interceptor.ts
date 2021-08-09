import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ResultCode } from '../common/enum';
import { Overlay } from '../services/overlay.service';

@Injectable()
export class BaseInterceptor implements HttpInterceptor {

  constructor(private overlay: Overlay) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (![200, 401].includes(error.status)) {
          if (error.error.code === ResultCode.AuthExpires) {
            this.overlay.presentToast('OnChat：授权令牌过期，请重新登录');
          } else {
            this.overlay.presentToast('操作失败，原因：' + (error.error.msg || error.error.message || error.statusText));
          }
        }

        return throwError(error);
      })
    );
  }
}
