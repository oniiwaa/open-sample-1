import { Injectable } from '@angular/core';
import { Client } from '@shared/models/client';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
@Injectable({
  providedIn: 'root'
})
export class LoginService {
  client: Client;
  private url = 'http://localhost:3000';
  constructor(
    private http: HttpClient,
  ) { }
  //1./api/oauth/clientにclient_name、redirect_uri、 user_idをPOST送信
  //2.クライアントの環境変数など安全な場所にclient_id、client_secret、redirect_uriを仕込む
  login(): Observable<any> {
    const uri = encodeURIComponent('http://localhost:3000/redirect');
    //this.client = new Client('her', '', '', 'http://localhost:3000/login', 2);
    this.client = new Client('her', '', '', uri, 2);
    return this.http.post(this.url + '/user/oauth/client', this.client)
      .pipe(
        map((response: any) => {
          const client_id = response.client_id;
          const client_secret = response.client_secret;
          const redirect_uri = response.redirect_uri;
          localStorage.setItem('client_id', client_id);
          localStorage.setItem('client_secret', client_secret);
          localStorage.setItem('redirect_uri', redirect_uri);
        }),
        catchError(this.handleError())
      )
  }
  //3./api/oauth/authorizeにresponse_type=code、client_id、redirect_uri、 scope（リードライトの権限設定みたいなもの）、state（クライアント側でsession情報をハッシュ化したものなど）をGET送信
  login2(): Observable<any> {
    return this.http.get(this.url + '/user/oauth/authorize'
      + '?client_id=' + localStorage.getItem('client_id')
      + '&redirect_uri=' + localStorage.getItem('redirect_uri')
      + '&scope=scope'
      + '&state=state')
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError(this.handleError())
      )
  }
  login3(id, password, params): Observable<any> {
    const user = { 'id': id, 'password': password }
    console.log('params');
    console.log(params);
    return this.http.post(this.url + '/user/oauth/authorize', params)
      .pipe(
        map((response: any) => {
          console.log('login3:' + response);
          return response;
        }),
        catchError(this.handleError())
      )
  }
  handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }


}
