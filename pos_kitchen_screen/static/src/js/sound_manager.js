odoo.define('pos_kitchen_screen.SoundManager', function(require) {
    'use strict';

    class KitchenSoundManager {
        constructor() {
            this.sounds = {
                newOrder: new Audio('/pos_kitchen_screen/static/src/sounds/new_order.mp3'),
                urgentOrder: new Audio('/pos_kitchen_screen/static/src/sounds/urgent_order.mp3')
            };
        }

        playNewOrderSound() {
            this.sounds.newOrder.play().catch(() => {});
        }

        playUrgentSound() {
            this.sounds.urgentOrder.play().catch(() => {});
        }
    }

    return KitchenSoundManager;
}); 