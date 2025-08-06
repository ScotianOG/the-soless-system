"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlatformBot = void 0;
class BasePlatformBot {
    constructor(config) {
        this.token = config.token;
        this.platform = config.platform;
    }
}
exports.BasePlatformBot = BasePlatformBot;
