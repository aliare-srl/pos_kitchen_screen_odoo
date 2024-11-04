odoo.define('pos_kitchen_screen.KitchenScreen', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const KitchenSoundManager = require('pos_kitchen_screen.SoundManager');

    class KitchenScreen extends PosComponent {
        setup() {
            super.setup();
            this.soundManager = new KitchenSoundManager();
            this.state = useState({
                orders: [],
                soundEnabled: true
            });
        }

        // Add toggle for sound
        toggleSound() {
            this.state.soundEnabled = !this.state.soundEnabled;
        }

        // Handle new order
        async onNewOrder(order) {
            if (this.state.soundEnabled) {
                this.soundManager.playNewOrderSound();
            }
            // Process order...
        }

        // Handle urgent orders
        async onUrgentOrder(order) {
            if (this.state.soundEnabled) {
                this.soundManager.playUrgentSound();
            }
            // Process urgent order...
        }
    }

    Registries.Component.add(KitchenScreen);
    return KitchenScreen;
}); 