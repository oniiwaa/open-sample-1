import { Component, OnInit } from '@angular/core';
import { LoginService } from '@shared/services/login.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-login2',
  templateUrl: './login2.component.html',
  styleUrls: ['./login2.component.scss']
})
export class Login2Component implements OnInit {
  public userForm!: FormGroup;
  constructor(
    private router: Router,
    private loginService: LoginService,
  ) { }

  ngOnInit(): void {
    this.userForm = new FormGroup({
      id: new FormControl('', [
        Validators.required
      ]),
      password: new FormControl('', [
        Validators.required
      ])
    });

  }
  saveGoods() {
    const { id, password } = this.userForm.getRawValue();
    let urlParamStr = window.location.search
    let params = {}
    //urlパラメータをオブジェクトにまとめる
    urlParamStr = urlParamStr.replace("?", "");
    urlParamStr.split('&').forEach(param => {
      const temp = param.split('=')
      //pramsオブジェクトにパラメータを追加
      params = {
        ...params,
        [temp[0]]: temp[1]
      }
    })
    if (id != "" && password != "") {
      this.loginService.login3(id, password, params)
        .subscribe((res) => {
          /*  if (res != Error) {
             console.log(res);
           } */
          console.log('login2:49');
        });
    }
  }
}
