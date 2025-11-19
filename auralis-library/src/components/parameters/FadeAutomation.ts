import { GLOBAL_CONFIG } from "@/core/AudioGlobalConfig";
import { ParamAutomation } from "./ParamAutomation";
import type { FadeConfig } from "./types";

/**
 * FadeAutomation class for automating fade in and fade out effects.
 */
export class FadeAutomation extends ParamAutomation {
    /**
     * Fade configuration for the fade in effect.
     * @type {FadeConfig}
     * @default GLOBAL_CONFIG.fadeIn
     */
    public inConfig: FadeConfig = {
        duration: GLOBAL_CONFIG.fadeIn.duration,
        curve: GLOBAL_CONFIG.fadeIn.curve
    };
    /**
     * Fade configuration for the fade out effect.
     * @type {FadeConfig}
     * @default GLOBAL_CONFIG.fadeOut
     */
    public outConfig: FadeConfig = {
        duration: GLOBAL_CONFIG.fadeOut.duration,
        curve: GLOBAL_CONFIG.fadeOut.curve,
    };
    /**
     * Fade in automation.
     * @param {number} from - The starting value for the fade in effect (default is 0).
     * @returns {Promise<void>} A promise that resolves when the fade in automation is complete.
     */
    public async in(from: number = GLOBAL_CONFIG.fadeIn.from) {

        // Stop the current automation if it's running
        this.stop();

        // Prepare values for the fade automation
        this._value = this.from = from;
        this.to = GLOBAL_CONFIG.fadeIn.to;
        this.duration = this.inConfig.duration;
        this.curve = this.inConfig.curve;

        // Let's go!
        await this.play();
    }
    /**
     * Fade out automation.
     * @param {number} from - The starting value for the fade out effect (default is 1).
     * @returns {Promise<void>} A promise that resolves when the fade out automation is complete.
     */
    public async out(from: number = GLOBAL_CONFIG.fadeOut.from) {

        // Stop the current automation if it's running
        this.stop();

        // Prepare values for the fade automation
        this._value = this.from = from;
        this.to = GLOBAL_CONFIG.fadeOut.to;
        this.duration = this.outConfig.duration;
        this.curve = this.outConfig.curve;

        // Let's go!
        await this.play();
    }
}
