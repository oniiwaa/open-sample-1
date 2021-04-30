export class Client {
    client_name: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    user_id: number;

    constructor(client_name, client_id, client_secret, redirect_uri, user_id) {
        this.client_name = client_name;
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.redirect_uri = redirect_uri;
        this.user_id = user_id;
    }
}