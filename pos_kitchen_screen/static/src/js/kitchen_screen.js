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

        async handleOrder(order) {
            // Condition for order type
            if (order.is_urgent) {
                this.soundManager.playUrgentSound();
            } else if (order.is_new) {
                this.soundManager.playNewOrderSound();
            }

            // Condition for order time
            if (order.preparation_time > 15) {
                // Alert for orders taking too long
                this.handleDelayedOrder(order);
            }

            // Condition for order size
            if (order.items.length > 5) {
                // Special handling for large orders
                this.handleLargeOrder(order);
            }
        }

        handleDelayedOrder(order) {
            if (this.state.soundEnabled) {
                // Play warning sound every 5 minutes
                if (order.delay_warnings < 3) {
                    this.soundManager.playWarningSound();
                    order.delay_warnings += 1;
                }
            }
        }

        // Condition for order priority
        setPriority(order) {
            if (order.is_vip) {
                return 'high';
            } else if (order.is_takeaway) {
                return 'medium';
            }
            return 'normal';
        }

        checkOrderTiming(order) {
            const currentTime = new Date();
            const orderTime = new Date(order.create_date);
            const timeDiff = (currentTime - orderTime) / 1000 / 60; // in minutes

            // Condition for order age
            if (timeDiff > 30) {
                return 'critical';
            } else if (timeDiff > 20) {
                return 'warning';
            } else if (timeDiff > 10) {
                return 'attention';
            }
            return 'normal';
        }

        // Condition for peak hours
        isPeakHour() {
            const hour = new Date().getHours();
            return (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
        }

        categorizeOrder(order) {
            // Condition for order category
            if (order.items.some(item => item.category === 'drinks')) {
                return 'bar';
            } else if (order.items.some(item => item.category === 'grill')) {
                return 'kitchen_grill';
            } else if (order.items.some(item => item.category === 'dessert')) {
                return 'dessert_station';
            }
            return 'main_kitchen';
        }

        // Condition for special items
        hasSpecialRequirements(order) {
            return order.items.some(item => 
                item.notes || 
                item.allergies || 
                item.customizations
            );
        }
    }

    Registries.Component.add(KitchenScreen);
    return KitchenScreen;
}); 