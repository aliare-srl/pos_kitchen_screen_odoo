odoo.define('pos_kitchen_screen.SoundManager', function(require) {
    'use strict';

    class KitchenSoundManager {
        constructor() {
            this.sounds = {
                newOrder: new Audio('/pos_kitchen_screen/static/src/sounds/new_order.mp3'),
                urgentOrder: new Audio('/pos_kitchen_screen/static/src/sounds/urgent_order.mp3')
            };
            this.volume = 0.5; // Default volume
        }

        setVolume(level) {
            // Condition for volume limits
            if (level < 0) {
                this.volume = 0;
            } else if (level > 1) {
                this.volume = 1;
            } else {
                this.volume = level;
            }

            // Apply volume to all sounds
            Object.values(this.sounds).forEach(sound => {
                sound.volume = this.volume;
            });
        }

        // Condition for quiet hours
        shouldPlaySound() {
            const hour = new Date().getHours();
            return !(hour >= 22 || hour <= 6); // Don't play between 10 PM and 6 AM
        }

        playNewOrderSound() {
            if (this.shouldPlaySound()) {
                this.sounds.newOrder.play().catch(() => {});
            }
        }

        playUrgentSound() {
            if (this.shouldPlaySound()) {
                this.sounds.urgentOrder.play().catch(() => {});
            }
        }
    }

    return KitchenSoundManager;
}); 