odoo.define('pos_kitchen_screen.ActionpadWidget', function(require) {
    'use strict';

    const ActionpadWidget = require('point_of_sale.ActionpadWidget');
    const Registries = require('point_of_sale.Registries');

    const KitchenActionpadWidget = (ActionpadWidget) => class extends ActionpadWidget {
        async submitOrder(options) {
            const order = this.env.pos.get_order();
            if (order) {
                try {
                    // First send to kitchen
                    await this.env.pos.sendOrderInPreparationUpdateLastChange(order);
                    // Then proceed with normal order submission
                    return super.submitOrder(options);
                } catch (error) {
                    console.error('Error submitting order:', error);
                    // Still allow order to proceed even if kitchen update fails
                    return super.submitOrder(options);
                }
            }
            return super.submitOrder(options);
        }
    }

    Registries.Component.extend(ActionpadWidget, KitchenActionpadWidget);
}); 