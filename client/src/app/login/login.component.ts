import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '@shared/services/login.service';
import { Client } from '@shared/models/client';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  client: Client;

  constructor(private loginService: LoginService, private router: Router) { }

  ngOnInit(): void {
  }
  login() {
    this.loginService.login()
      .subscribe((res) => {
        if (res != Error) {
          this.loginService.login2()
            .subscribe((res) => {
              location.replace(res);
            })
        }
      })
  }
}
