export type HttpRequestMethod = 'GET' | 'POST';

export type HttpRequestBody = BufferSource | string | null;
export interface IHttpRequest {
  url: string;
  method: string;
  responseType: HttpResponseType;
  body: HttpRequestBody;
  headers: Map<string, string>;
}

export interface IHttpResponse {
  request: IHttpRequest;
  ok: boolean;
  status: number;
  headers: string;
  data: ArrayBuffer | string;
  message: string;
}

export type HttpResponseType = 'arraybuffer' | 'text';
export type HttpResponseData = ArrayBuffer | string;

export interface ITimer {
  tickAfter(seconds: number): ITimer;
  tickEvery(seconds: number): ITimer;
  clear(): void;
}
