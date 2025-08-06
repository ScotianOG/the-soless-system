// Override the Router type definitions to allow for more flexible return types
import { Router, Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface RouterMethod {
    (path: string, ...handlers: Array<(req: Request, res: Response, next: NextFunction) => any>): Router;
  }
  
  interface Router {
    get: RouterMethod;
    post: RouterMethod;
    put: RouterMethod;
    delete: RouterMethod;
    patch: RouterMethod;
    options: RouterMethod;
    head: RouterMethod;
  }
}
