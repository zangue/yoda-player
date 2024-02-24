import {
  IHttpRequest,
  IHttpResponse,
  HttpResponseType,
  HttpResponseData,
  HttpRequestBody,
  HttpRequestMethod,
} from './types';

export class HttpRequest implements IHttpRequest {
  private url_: string;
  private method_: HttpRequestMethod = 'GET';
  private headers_: Map<string, string> = new Map();
  private body_: HttpRequestBody = null;
  private responseType_: HttpResponseType = 'arraybuffer';

  constructor(url: string) {
    this.url_ = url;
  }

  get url(): string {
    return this.url_;
  }

  set url(newUrl: string) {
    this.url_ = newUrl;
  }

  get method(): HttpRequestMethod {
    return this.method_;
  }

  set method(newMethod: HttpRequestMethod) {
    this.method_ = newMethod;
  }

  get responseType(): HttpResponseType {
    return this.responseType_;
  }

  set responseType(newResponseType: HttpResponseType) {
    this.responseType_ = newResponseType;
  }

  get body(): HttpRequestBody {
    return this.body_;
  }

  set body(body: HttpRequestBody) {
    this.body_ = body;
  }

  get headers(): Map<string, string> {
    return this.headers_;
  }

  setHeader(key: string, value: string) {
    this.headers_.set(key, value);
  }
}

export class HttpResponse implements IHttpResponse {
  private request_: IHttpRequest;
  private status_: number;
  private headers_: string;
  private data_: HttpResponseData;
  private ok_: boolean;
  private message_ = '';

  constructor(
    request: IHttpRequest,
    status: number,
    headers: string,
    data: HttpResponseData,
    ok: boolean,
    message: string
  ) {
    this.request_ = request;
    this.status_ = status;
    this.headers_ = headers;
    this.data_ = data;
    this.ok_ = ok;
    this.message_ = message;
  }

  get request(): IHttpRequest {
    return this.request_;
  }

  get status(): number {
    return this.status_;
  }

  get headers(): string {
    return this.headers_;
  }

  get data(): HttpResponseData {
    return this.data_;
  }

  get ok(): boolean {
    return this.ok_;
  }

  get message(): string {
    return this.message_;
  }
}

export class NetworkHandle {
  static fetch(request: IHttpRequest): Promise<IHttpResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(request.method, request.url);
      xhr.responseType = request.responseType;
      request.headers.forEach((value, name) => {
        xhr.setRequestHeader(name, value);
      });

      const makeResponse = (isOk: boolean): IHttpResponse => {
        return new HttpResponse(
          request,
          xhr.status,
          xhr.getAllResponseHeaders(),
          xhr.response,
          isOk,
          xhr.statusText
        );
      };

      xhr.onload = ev => {
        const response = makeResponse(xhr.status >= 200 && xhr.status < 300);

        if (response.ok) {
          resolve(response);
        } else {
          reject(response);
        }
      };

      xhr.onerror =
        xhr.ontimeout =
        xhr.onabort =
          ev => {
            reject(makeResponse(false));
          };

      xhr.send(request.body);
    });
  }
}
