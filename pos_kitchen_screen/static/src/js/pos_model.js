odoo.define('pos_kitchen_screen.pos_model', function (require) {
    'use strict';

    const { PosGlobalState } = require('point_of_sale.models');
    const Registries = require('point_of_sale.Registries');

    const PosKitchenOrderModel = (PosGlobalState) => class PosKitchenOrderModel extends PosGlobalState {
        async sendOrderInPreparationUpdateLastChange(order) {
            try {
                // Send order update to kitchen screen
                await this.env.services.rpc({
                    model: 'pos.order',
                    method: 'update_kitchen_order_status',
                    args: [[order.uid], {
                        state: 'in_preparation',
                        preparation_time: new Date().toISOString(),
                    }],
                });
                return true;
            } catch (error) {
                console.error('Failed to update order status:', error);
                return false;
            }
        }
    }

    Registries.Model.extend(PosGlobalState, PosKitchenOrderModel);
}); 