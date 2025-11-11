declare module "pino-http" {
  import { Logger } from "pino";
  import { Handler } from "express";

  export interface Options {
    logger?: Logger;
  }

  export default function pinoHttp(options?: Options): Handler;
}