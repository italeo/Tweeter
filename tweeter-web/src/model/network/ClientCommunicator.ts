import { TweeterRequest, TweeterResponse } from "tweeter-shared";

export class ClientCommunicator {
  private SERVER_URL: string;

  public constructor(SERVER_URL: string) {
    this.SERVER_URL = SERVER_URL;
  }

  public async doPost<REQ extends TweeterRequest, RES extends TweeterResponse>(
    req: REQ | undefined,
    endpoint: string,
    headers?: Headers
  ): Promise<RES> {
    if (!headers) {
      headers = new Headers({
        "Content-type": "application/json",
      });
    } else {
      headers.set("Content-type", "application/json");
    }

    console.log(`The request body is '${JSON.stringify(req)}'`);

    const url = this.getUrl(endpoint);
    const params = this.getParams(
      "POST",
      headers,
      req ? JSON.stringify(req) : req
    );

    console.log(`Fetching '${url}' with params '${JSON.stringify(params)}'`);

    try {
      const resp: Response = await fetch(url, params);

      if (resp.ok) {
        const response: RES = await resp.json();
        return response;
      } else {
        const error = await resp.json();
        throw new Error(error.errorMessage || "An unknown error occurred");
      }
    } catch (error) {
      console.error("ClientCommunicator error:", error);
      throw new Error(
        `Client communicator POST failed:\n${(error as Error).message}`
      );
    }
  }

  private getUrl(endpoint: string): string {
    return this.SERVER_URL + endpoint;
  }

  private getParams(
    method: string,
    headers?: Headers,
    body?: BodyInit
  ): RequestInit {
    const params: RequestInit = { method: method };

    if (headers) {
      params.headers = headers;
    }

    if (body) {
      params.body = body;
    }

    return params;
  }
}
