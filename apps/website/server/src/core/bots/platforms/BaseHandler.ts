import { Platform } from '../../../types';

export abstract class BaseHandler {
  protected platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  abstract initialize(): Promise<void>;
}
